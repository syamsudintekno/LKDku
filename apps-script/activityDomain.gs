// Generated from src/domain/activity.js. Run node scripts/sync-domain.mjs.

function activityError(message, code = 'VALIDATION') {
  const error = new Error(message)
  error.code = code
  throw error
}

function activityText(value, label, required = false, limit = 2000) {
  if (value === undefined || value === null) value = ''
  if (typeof value !== 'string' || value.length > limit)
    activityError(`${label} tidak valid atau terlalu panjang.`)
  value = value.trim()
  if (required && !value) activityError(`${label} wajib diisi.`)
  if (value.startsWith('=')) activityError(`${label} tidak boleh diawali tanda sama dengan.`)
  return value
}

function validActivityTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function validateActivity(payload, refs, previous = null) {
  if (!payload || !isIsoDate(payload.tanggal)) activityError('Tanggal kegiatan tidak valid.')
  if (!['skp', 'insidental'].includes(payload.sumber))
    activityError('Pilih sumber kegiatan dari SKP atau insidental.')
  const status = payload.status === undefined ? 'rencana' : payload.status
  if (!['rencana', 'terealisasi', 'dibatalkan'].includes(status))
    activityError('Status kegiatan tidak valid.')
  const start = activityText(payload.jam_mulai, 'Jam mulai')
  const end = activityText(payload.jam_selesai, 'Jam selesai')
  if ((start || end) && (!validActivityTime(start) || !validActivityTime(end) || start >= end))
    activityError('Isi kedua jam dengan jam selesai setelah jam mulai.')
  if (
    !['string', 'number'].includes(typeof payload.jumlah) ||
    String(payload.jumlah).trim() === '' ||
    !Number.isFinite(Number(payload.jumlah)) ||
    Number(payload.jumlah) <= 0 ||
    Number(payload.jumlah) > 1000000000
  )
    activityError('Jumlah harus berupa angka positif, paling besar satu miliar.')
  const unsur = activityText(payload.unsur, 'Unsur', true)
  const satuan = activityText(payload.satuan, 'Satuan', true)
  if (
    !(refs.config?.unsur_list || []).includes(unsur) ||
    !(refs.config?.satuan_list || []).includes(satuan)
  )
    activityError('Pilih unsur dan satuan yang tersedia.')
  const itemId = activityText(payload.skp_item_id, 'Butir SKP', false, 200)
  const templateId = activityText(payload.template_id, 'Template', false, 200)
  const reason = activityText(
    payload.alasan_insidental,
    'Alasan insidental',
    payload.sumber === 'insidental',
  )
  if (
    previous?.generated_key &&
    (itemId !== previous.skp_item_id ||
      templateId !== previous.template_id ||
      payload.sumber !== 'skp')
  )
    activityError('Tautan SKP dan template kegiatan hasil generator harus dipertahankan.')
  if (payload.sumber === 'insidental') {
    if (itemId || templateId)
      activityError('Kegiatan insidental tidak memiliki tautan SKP atau template.')
  } else {
    const item = (refs.items || []).find((row) => row.id === itemId)
    const year = (refs.years || []).find((row) => row.id === item?.skp_year_id)
    const keepingLink = previous?.sumber === 'skp' && previous.skp_item_id === itemId
    if (!item || !year || Number(year.tahun) !== Number(payload.tanggal.slice(0, 4)))
      activityError('Pilih butir SKP yang sesuai tahun kegiatan.')
    if (
      !keepingLink &&
      (item.deleted == 1 ||
        Number(item.aktif) !== 1 ||
        year.deleted == 1 ||
        year.status !== 'aktif')
    )
      activityError('Butir kegiatan baru harus berasal dari SKP aktif dan butir aktif.')
    if (templateId) {
      const template = (refs.templates || []).find(
        (row) => row.id === templateId && row.skp_item_id === itemId,
      )
      if (!template || (template.deleted == 1 && previous?.template_id !== templateId))
        activityError('Template harus berasal dari butir SKP yang dipilih.')
    }
  }
  const bukti = activityText(payload.bukti_url, 'Tautan bukti')
  if (bukti && !/^https?:\/\/[^\s]+$/i.test(bukti))
    activityError('Tautan bukti harus memakai http atau https.')
  return {
    tanggal: payload.tanggal,
    deskripsi: activityText(payload.deskripsi, 'Deskripsi', true),
    unsur,
    jumlah: Number(payload.jumlah),
    satuan,
    jam_mulai: start,
    jam_selesai: end,
    skp_item_id: itemId,
    template_id: templateId,
    sumber: payload.sumber,
    alasan_insidental: payload.sumber === 'insidental' ? reason : '',
    status,
    bukti_url: bukti,
    catatan: activityText(payload.catatan, 'Catatan'),
  }
}

function findTimeConflicts(candidate, rows) {
  if (
    candidate.deleted == 1 ||
    candidate.status === 'dibatalkan' ||
    !validActivityTime(candidate.jam_mulai) ||
    !validActivityTime(candidate.jam_selesai)
  )
    return []
  return rows.filter(
    (row) =>
      row !== candidate &&
      !(candidate.id && candidate.id === row.id) &&
      row.deleted != 1 &&
      row.status !== 'dibatalkan' &&
      row.tanggal === candidate.tanggal &&
      validActivityTime(row.jam_mulai) &&
      validActivityTime(row.jam_selesai) &&
      candidate.jam_mulai < row.jam_selesai &&
      row.jam_mulai < candidate.jam_selesai,
  )
}

function numberActivities(rows) {
  const sorted = rows
    .filter((row) => row.deleted != 1)
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        a.row.tanggal.localeCompare(b.row.tanggal) ||
        (a.row.jam_mulai || '24:00').localeCompare(b.row.jam_mulai || '24:00') ||
        String(a.row.created_at || '').localeCompare(String(b.row.created_at || '')) ||
        Number(a.row._rowIndex || a.index) - Number(b.row._rowIndex || b.index) ||
        a.index - b.index,
    )
  let date = ''
  let number = 0
  return sorted.map(({ row }) => {
    if (row.tanggal !== date) {
      date = row.tanggal
      number = 0
    }
    return { ...row, nomor: ++number }
  })
}

function realizedActivities(rows) {
  return numberActivities(rows.filter((row) => row.status === 'terealisasi'))
}

function activityDescription(row) {
  const range = formatTimeRange(row.jam_mulai, row.jam_selesai)
  return range && !row.deskripsi.endsWith(`pukul ${range}`)
    ? `${row.deskripsi} pukul ${range}`
    : row.deskripsi
}
