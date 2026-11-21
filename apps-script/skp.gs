function handle_skp_year_list(payload, ctx) {
  return getSheetRecords('skp_year')
}
function handle_skp_year_upsert(payload, ctx) {
  return withLock(function () {
    var tahun = referenceNumber(payload.tahun, 'Tahun', 1900, 2200, true)
    var status = referenceText(payload.status, 'Status SKP', true)
    if (['draft', 'aktif', 'arsip'].indexOf(status) < 0)
      referenceError('VALIDATION', 'Status SKP tidak valid.')
    var previous = payload.id ? referenceRecord('skp_year', payload.id) : null
    if (!previous && status !== 'draft')
      referenceError('VALIDATION', 'SKP baru dimulai dari status draft.')
    if (previous && Number(previous.tahun) !== tahun)
      referenceError('VALIDATION', 'Tahun SKP yang sudah dibuat tidak dapat dipindahkan.')
    if (
      previous &&
      (previous.status === 'arsip' || (previous.status === 'aktif' && status === 'draft'))
    )
      referenceError('FORBIDDEN_STATE', 'Urutan status SKP adalah draft, aktif, lalu arsip.')
    if (
      status === 'aktif' &&
      getSheetRecords('skp_year').some(function (row) {
        return row.id !== payload.id && Number(row.tahun) === tahun && row.status === 'aktif'
      })
    )
      referenceError(
        'VALIDATION',
        'Sudah ada SKP aktif pada tahun ini. Arsipkan yang lama terlebih dahulu.',
      )
    return saveReference(
      'skp_year',
      payload,
      { tahun: tahun, status: status, catatan: referenceText(payload.catatan, 'Catatan', false) },
      ctx,
      'skp.year.upsert',
    )
  })
}
function handle_skp_item_list(payload, ctx) {
  return getSheetRecords('skp_item').filter(function (row) {
    return !payload.skp_year_id || row.skp_year_id === payload.skp_year_id
  })
}
function handle_skp_item_upsert(payload, ctx) {
  return withLock(function () {
    var parent = assertEditableYear(payload.skp_year_id)
    var previous = payload.id ? referenceRecord('skp_item', payload.id) : null
    if (previous && previous.skp_year_id !== parent.id)
      referenceError('VALIDATION', 'Butir tidak dapat dipindahkan ke SKP lain.')
    var config = referenceConfig()
    var kode = referenceText(payload.kode, 'Kode butir', true, 80)
    if (
      getSheetRecords('skp_item').some(function (row) {
        return (
          row.id !== payload.id &&
          row.skp_year_id === parent.id &&
          row.kode.toLowerCase() === kode.toLowerCase()
        )
      })
    )
      referenceError('VALIDATION', 'Kode butir sudah dipakai pada SKP ini.')
    var unsur = referenceText(payload.unsur, 'Unsur', true)
    var satuan = referenceText(payload.satuan_target, 'Satuan target', true)
    if (
      (config.unsur_list || []).indexOf(unsur) < 0 ||
      (config.satuan_list || []).indexOf(satuan) < 0
    )
      referenceError('VALIDATION', 'Pilih unsur dan satuan yang tersedia.')
    var aktif =
      payload.aktif === undefined ? 1 : referenceNumber(payload.aktif, 'Status aktif', 0, 1, true)
    return saveReference(
      'skp_item',
      payload,
      {
        skp_year_id: parent.id,
        kode: kode,
        unsur: unsur,
        rencana_hasil_kerja: referenceText(
          payload.rencana_hasil_kerja,
          'Rencana hasil kerja',
          true,
        ),
        indikator: referenceText(payload.indikator, 'Indikator', true),
        target_tahunan: referenceNumber(
          payload.target_tahunan,
          'Target tahunan',
          0.000001,
          1000000000,
          false,
        ),
        satuan_target: satuan,
        catatan: referenceText(payload.catatan, 'Catatan', false),
        aktif: aktif,
      },
      ctx,
      'skp.item.upsert',
    )
  })
}
function handle_skp_template_list(payload, ctx) {
  return getSheetRecords('skp_template').filter(function (row) {
    return !payload.skp_item_id || row.skp_item_id === payload.skp_item_id
  })
}
function validatedSkpTemplate(payload) {
  var item = referenceRecord('skp_item', payload.skp_item_id)
  var year = assertEditableYear(item.skp_year_id)
  var previous = payload.id ? referenceRecord('skp_template', payload.id) : null
  if (previous && previous.skp_item_id !== item.id)
    referenceError('VALIDATION', 'Template tidak dapat dipindahkan ke butir lain.')
  var schedule = validateTemplateSchedule(payload)
  if (
    Number(schedule.tgl_mulai.slice(0, 4)) !== Number(year.tahun) ||
    Number(schedule.tgl_akhir.slice(0, 4)) !== Number(year.tahun)
  )
    referenceError('VALIDATION', 'Rentang template harus berada pada tahun SKP.')
  var unit = referenceText(payload.satuan, 'Satuan', true)
  if ((referenceConfig().satuan_list || []).indexOf(unit) < 0)
    referenceError('VALIDATION', 'Pilih satuan yang tersedia.')
  return {
    skp_item_id: item.id,
    deskripsi: referenceText(payload.deskripsi, 'Deskripsi template', true),
    hari: schedule.hari,
    frekuensi: schedule.frekuensi,
    tgl_mulai: schedule.tgl_mulai,
    tgl_akhir: schedule.tgl_akhir,
    jam_mulai: schedule.jam_mulai,
    jam_selesai: schedule.jam_selesai,
    jumlah: referenceNumber(payload.jumlah, 'Jumlah', 0.000001, 1000000000, false),
    satuan: unit,
    pengecualian: JSON.stringify(schedule.pengecualian),
    urutan: referenceNumber(payload.urutan, 'Urutan', 1, 10000, true),
  }
}
function handle_skp_template_upsert(payload, ctx) {
  return withLock(function () {
    return saveReference(
      'skp_template',
      payload,
      validatedSkpTemplate(payload),
      ctx,
      'skp.template.upsert',
    )
  })
}
function handle_skp_template_preview(payload, ctx) {
  var template = validatedSkpTemplate(payload)
  return { dates: previewTemplateDates(template, payload.month, getSheetRecords('holiday')) }
}
function changeSkpDeletion(payload, ctx, name, restoring) {
  return withLock(function () {
    var record = referenceRecord(name, payload.id, restoring)
    if ((record.deleted == 1) !== restoring)
      referenceError('FORBIDDEN_STATE', 'Status data sudah berubah. Muat ulang daftar.')
    referenceVersion(record, payload)
    var parentItem =
      name === 'skp_template' ? referenceRecord('skp_item', record.skp_item_id) : record
    assertEditableYear(parentItem.skp_year_id)
    var stamp = referenceStamp()
    var changes = []
    if (name === 'skp_item') {
      changes = getSheetRecords('skp_template', restoring)
        .filter(function (row) {
          return (
            row.skp_item_id === record.id &&
            (!restoring || (row.deleted == 1 && row.updated_at === record.updated_at))
          )
        })
        .map(function (row) {
          return Object.assign({}, row, { deleted: restoring ? 0 : 1, updated_at: stamp })
        })
      commitReference('skp_template', changes)
    }
    var result = Object.assign({}, record, { deleted: restoring ? 0 : 1, updated_at: stamp })
    commitReference(name, [result])
    appendAudit(
      name + (restoring ? '.restore' : '.delete'),
      name,
      record.id,
      restoring ? 'Data dipulihkan.' : 'Data dihapus sementara.',
    )
    return { record: result, related: changes }
  })
}
function handle_skp_item_delete(payload, ctx) {
  return changeSkpDeletion(payload, ctx, 'skp_item', false)
}
function handle_skp_item_restore(payload, ctx) {
  return changeSkpDeletion(payload, ctx, 'skp_item', true)
}
function handle_skp_template_delete(payload, ctx) {
  return changeSkpDeletion(payload, ctx, 'skp_template', false)
}
function handle_skp_template_restore(payload, ctx) {
  return changeSkpDeletion(payload, ctx, 'skp_template', true)
}
