function validatedHoliday(payload, tahun) {
  if (!isIsoDate(payload.tanggal) || (tahun && Number(payload.tanggal.slice(0, 4)) !== tahun))
    referenceError('VALIDATION', 'Tanggal libur harus valid dan sesuai tahun pilihan.')
  var jenis = referenceText(payload.jenis, 'Jenis libur', true)
  if (['nasional', 'cuti_bersama', 'kampus'].indexOf(jenis) < 0)
    referenceError('VALIDATION', 'Jenis libur tidak valid.')
  return {
    tanggal: payload.tanggal,
    jenis: jenis,
    keterangan: referenceText(payload.keterangan, 'Keterangan libur', true, 500),
  }
}
function handle_holiday_list(payload, ctx) {
  var tahun = referenceNumber(payload.tahun, 'Tahun', 1900, 2200, true)
  return getSheetRecords('holiday').filter(function (row) {
    return Number(row.tanggal.slice(0, 4)) === tahun
  })
}
function handle_holiday_upsert(payload, ctx) {
  return withLock(function () {
    var fields = validatedHoliday(payload)
    if (
      getSheetRecords('holiday').some(function (row) {
        return row.id !== payload.id && row.tanggal === fields.tanggal
      })
    )
      referenceError('VALIDATION', 'Tanggal libur ini sudah ada. Ubah catatan yang tersedia.')
    return saveReference('holiday', payload, fields, ctx, 'holiday.upsert')
  })
}
function handle_holiday_import(payload, ctx) {
  return withLock(function () {
    var tahun = referenceNumber(payload.tahun, 'Tahun', 1900, 2200, true)
    if (!Array.isArray(payload.rows) || payload.rows.length === 0 || payload.rows.length > 400)
      referenceError('VALIDATION', 'Impor memerlukan 1 sampai 400 baris libur.')
    // Validate the whole input before the first write.
    var fields = payload.rows.map(function (row) {
      if (!row || typeof row !== 'object') referenceError('VALIDATION', 'Baris impor tidak valid.')
      return validatedHoliday(row, tahun)
    })
    var existing = getSheetRecords('holiday')
    var seen = {}
    existing.forEach(function (row) {
      seen[row.tanggal] = true
    })
    var stamp = referenceStamp()
    var additions = []
    fields.forEach(function (row) {
      if (!seen[row.tanggal]) {
        seen[row.tanggal] = true
        additions.push(
          Object.assign({}, row, {
            id: generateUuid(),
            created_at: stamp,
            updated_at: stamp,
            deleted: 0,
          }),
        )
      }
    })
    commitReference('holiday', additions)
    appendAudit(
      'holiday.import',
      'holiday',
      String(tahun),
      additions.length + ' hari libur ditambahkan.',
    )
    return {
      records: additions,
      added: additions.length,
      skipped: fields.length - additions.length,
    }
  })
}
function changeHolidayDeletion(payload, ctx, restoring) {
  return withLock(function () {
    var row = referenceRecord('holiday', payload.id, restoring)
    referenceVersion(row, payload)
    if ((row.deleted == 1) !== restoring)
      referenceError('FORBIDDEN_STATE', 'Status hari libur sudah berubah.')
    if (
      restoring &&
      getSheetRecords('holiday').some(function (other) {
        return other.tanggal === row.tanggal
      })
    )
      referenceError('CONFLICT', 'Tanggal ini sudah memiliki catatan libur baru.')
    var result = Object.assign({}, row, {
      deleted: restoring ? 0 : 1,
      updated_at: referenceStamp(),
    })
    commitReference('holiday', [result])
    appendAudit(
      restoring ? 'holiday.restore' : 'holiday.delete',
      'holiday',
      row.id,
      restoring ? 'Libur dipulihkan.' : 'Libur dihapus sementara.',
    )
    return { record: result }
  })
}
function handle_holiday_delete(payload, ctx) {
  return changeHolidayDeletion(payload, ctx, false)
}
function handle_holiday_restore(payload, ctx) {
  return changeHolidayDeletion(payload, ctx, true)
}
