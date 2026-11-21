function activityReferences() {
  return {
    years: getSheetRecords('skp_year', true),
    items: getSheetRecords('skp_item', true),
    templates: getSheetRecords('skp_template', true),
    config: referenceConfig(),
  }
}
function activityMonthIsFinal(month) {
  monthDates(month)
  return getSheetRecords('report_month').some(function (row) {
    return (
      Number(row.tahun) === Number(month.slice(0, 4)) &&
      Number(row.bulan) === Number(month.slice(5, 7)) &&
      row.status === 'final'
    )
  })
}
function assertEditableActivityMonth(date) {
  if (typeof date !== 'string')
    referenceError('VALIDATION', 'Tanggal atau bulan kegiatan wajib diisi.')
  var month = date.slice(0, 7)
  if (activityMonthIsFinal(month))
    referenceError(
      'FORBIDDEN_STATE',
      'Bulan ini sudah final. Buka kembali laporan sebelum mengubah kegiatan.',
    )
}
function handle_activity_list(payload, ctx) {
  monthDates(payload.month)
  return {
    month: payload.month,
    records: getSheetRecords('activity').filter(function (row) {
      return row.tanggal.slice(0, 7) === payload.month
    }),
    holidays: getSheetRecords('holiday').filter(function (row) {
      return row.tanggal.slice(0, 7) === payload.month
    }),
    references: activityReferences(),
    final: activityMonthIsFinal(payload.month),
  }
}
function handle_activity_upsert(payload, ctx) {
  return withLock(function () {
    var all = getSheetRecords('activity', true)
    var previous = payload.id
      ? all.filter(function (row) {
          return row.id === payload.id
        })[0]
      : null
    if (previous) assertEditableActivityMonth(previous.tanggal)
    assertEditableActivityMonth(payload.tanggal)
    if (previous && previous.deleted == 1)
      referenceError(
        'FORBIDDEN_STATE',
        'Kegiatan sudah dihapus sementara. Pulihkan terlebih dahulu.',
      )
    if (payload.create !== undefined && typeof payload.create !== 'boolean')
      referenceError('VALIDATION', 'Pilihan pembuatan kegiatan tidak valid.')
    if (payload.id && !previous && !payload.create)
      referenceError('NOT_FOUND', 'Kegiatan tidak ditemukan. Muat ulang daftar.')
    var fields = validateActivity(payload, activityReferences(), previous)
    if (previous && payload.create) {
      if (
        !Object.keys(fields).every(function (key) {
          return previous[key] === fields[key]
        })
      )
        referenceError(
          'CONFLICT',
          'Kegiatan dengan ID ini sudah tersimpan dengan isi berbeda. Muat ulang daftar.',
        )
      return { record: previous, conflicts: findTimeConflicts(previous, all), created: false }
    }
    if (previous) referenceVersion(previous, payload)
    if (
      payload.id &&
      !previous &&
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(payload.id)
    )
      referenceError('VALIDATION', 'ID kegiatan baru tidak valid.')
    var stamp = referenceStamp()
    var record = Object.assign(
      {},
      previous || {
        id: payload.id || generateUuid(),
        created_at: stamp,
        generated_key: '',
        deleted: 0,
      },
      fields,
      { updated_at: stamp },
    )
    commitReference('activity', [record])
    appendAudit(
      'activity.upsert',
      'activity',
      record.id,
      previous ? 'Kegiatan diperbarui.' : 'Kegiatan ditambahkan.',
    )
    return { record: record, conflicts: findTimeConflicts(record, all), created: !previous }
  })
}
function handle_activity_bulkStatus(payload, ctx) {
  return withLock(function () {
    if (
      !Array.isArray(payload.changes) ||
      !payload.changes.length ||
      payload.changes.length > 1000 ||
      !['rencana', 'terealisasi', 'dibatalkan'].includes(payload.status)
    )
      referenceError('VALIDATION', 'Pilih 1 sampai 1000 kegiatan dan status yang tersedia.')
    var ids = payload.changes.map(function (change) {
      return change && change.id
    })
    if (new Set(ids).size !== ids.length)
      referenceError('VALIDATION', 'Daftar kegiatan mengandung ID duplikat.')
    var rows = getSheetRecords('activity')
    var refs = activityReferences()
    // All validation precedes the first write.
    var changes = payload.changes.map(function (change) {
      var previous = rows.filter(function (row) {
        return row.id === change.id
      })[0]
      if (!previous) referenceError('NOT_FOUND', 'Salah satu kegiatan tidak ditemukan.')
      assertEditableActivityMonth(previous.tanggal)
      referenceVersion(previous, change)
      return Object.assign(
        {},
        previous,
        validateActivity(Object.assign({}, previous, { status: payload.status }), refs, previous),
      )
    })
    var stamp = referenceStamp()
    changes.forEach(function (row) {
      row.updated_at = stamp
    })
    commitReference('activity', changes)
    appendAudit(
      'activity.bulkStatus',
      'activity',
      '',
      changes.length + ' status kegiatan diperbarui.',
    )
    return { records: changes }
  })
}
function changeActivityDeletion(payload, ctx, restoring) {
  return withLock(function () {
    var previous = referenceRecord('activity', payload.id, restoring)
    assertEditableActivityMonth(previous.tanggal)
    referenceVersion(previous, payload)
    if ((previous.deleted == 1) !== restoring)
      referenceError('FORBIDDEN_STATE', 'Status penghapusan kegiatan sudah berubah.')
    var record = Object.assign({}, previous, {
      deleted: restoring ? 0 : 1,
      updated_at: referenceStamp(),
    })
    commitReference('activity', [record])
    appendAudit(
      restoring ? 'activity.restore' : 'activity.delete',
      'activity',
      record.id,
      restoring ? 'Kegiatan dipulihkan.' : 'Kegiatan dihapus sementara.',
    )
    return {
      record: record,
      conflicts: restoring ? findTimeConflicts(record, getSheetRecords('activity')) : [],
    }
  })
}
function handle_activity_delete(payload, ctx) {
  return changeActivityDeletion(payload, ctx, false)
}
function handle_activity_restore(payload, ctx) {
  return changeActivityDeletion(payload, ctx, true)
}
