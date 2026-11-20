// Generated from src/domain/report.js. Run node scripts/sync-domain.mjs.

function buildReport({
  month,
  records,
  holidays = [],
  profile,
  tanggal_ttd,
  includePlans = false,
}) {
  const dates = monthDates(month)
  const signature = tanggal_ttd === undefined ? dates[dates.length - 1] : tanggal_ttd
  if (!isIsoDate(signature)) activityError('Tanggal tanda tangan tidak valid.')
  const selected = records.filter(
    (row) =>
      row.deleted != 1 &&
      row.tanggal.slice(0, 7) === month &&
      (row.status === 'terealisasi' || (includePlans && row.status === 'rencana')),
  )
  const days = buildActivityDays(month, selected, holidays)
  return JSON.parse(
    JSON.stringify({
      schemaVersion: 1,
      month,
      profile,
      tanggal_ttd: signature,
      rows: days
        .filter((day) => day.kind !== 'empty')
        .map((day) => ({
          tanggal: day.tanggal,
          kind: day.kind,
          records: day.records.map((row) => ({
            id: row.id,
            nomor: row.nomor,
            deskripsi_laporan: activityDescription(row),
            unsur: row.unsur,
            jumlah: row.jumlah,
            satuan: row.satuan,
            status: row.status,
            sumber: row.sumber,
          })),
        })),
    }),
  )
}

function validateReport({
  month,
  records,
  holidays = [],
  profile,
  references,
  tanggal_ttd,
}) {
  const errors = [],
    warnings = []
  const issue = (list, code, message, tanggal) =>
    list.push({ code, message, ...(tanggal ? { tanggal } : {}) })
  const dates = monthDates(month)
  if (!profile.logo_kop)
    issue(
      warnings,
      'NO_LOGO',
      'Logo kop belum diunggah. Lengkapi logo pada Pengaturan sebelum mencetak laporan.',
    )
  else if (
    typeof profile.logo_kop !== 'string' ||
    profile.logo_kop.length > 20000 ||
    !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(profile.logo_kop)
  )
    issue(errors, 'LOGO', 'Logo kop tidak valid.')
  if (tanggal_ttd !== undefined && !isIsoDate(tanggal_ttd))
    issue(errors, 'SIGNATURE_DATE', 'Tanggal tanda tangan tidak valid.')
  for (const key of [
    'nama',
    'nip',
    'jabatan',
    'unit_kerja',
    'satuan_kerja',
    'kop_1',
    'kop_2',
    'alamat_kop',
    'kota_ttd',
    'atasan_nama',
    'atasan_nip',
    'atasan_jabatan',
    'folder_pdf_id',
  ]) {
    if (typeof profile[key] !== 'string' || !profile[key].trim())
      issue(errors, 'PROFILE', `Lengkapi profil: ${key}.`)
  }
  for (const key of ['nip', 'atasan_nip'])
    if (profile[key] && !/^\d{18}$/.test(profile[key]))
      issue(errors, 'PROFILE', `${key} harus terdiri dari 18 angka.`)
  if (profile.folder_pdf_id && !/^[a-zA-Z0-9_-]{10,200}$/.test(profile.folder_pdf_id))
    issue(errors, 'PROFILE', 'ID folder PDF tidak valid.')
  const active = records.filter(
    (row) => row.deleted != 1 && row.tanggal.slice(0, 7) === month && row.status !== 'dibatalkan',
  )
  for (const row of active) {
    try {
      validateActivity(row, references, row)
    } catch (error) {
      issue(errors, 'ACTIVITY', error.message, row.tanggal)
    }
  }
  const realized = active.filter((row) => row.status === 'terealisasi')
  if (!realized.length)
    issue(errors, 'NO_REALIZED', 'Belum ada kegiatan terealisasi untuk laporan final.')
  const planned = active.filter((row) => row.status === 'rencana').length
  if (planned)
    issue(
      warnings,
      'PLANNED',
      `${planned} kegiatan rencana tidak akan masuk laporan final.`,
      active.find((row) => row.status === 'rencana').tanggal,
    )
  for (const day of buildActivityDays(month, realized, holidays)) {
    if (day.kind === 'empty')
      issue(warnings, 'EMPTY_WORKDAY', 'Hari kerja kosong dalam laporan final.', day.tanggal)
    if (day.warnings.includes('Bentrok jam'))
      issue(warnings, 'TIME_CONFLICT', 'Ada bentrok jam kegiatan.', day.tanggal)
  }
  if (!realized.some((row) => row.unsur === 'Pengabdian'))
    issue(warnings, 'NO_COMMUNITY', 'Belum ada kegiatan Pengabdian pada bulan ini.')
  if (!errors.length) {
    const provisional = {
      report: buildReport({ month, records, holidays, profile, tanggal_ttd }),
      validation: {
        errors,
        warnings,
        planned,
        realized: realized.length,
        tanggal_ttd: tanggal_ttd || dates[dates.length - 1],
      },
      sourceVersion: 'x'.repeat(64),
    }
    if (JSON.stringify(provisional).length > 45000)
      issue(
        errors,
        'SNAPSHOT_SIZE',
        'Ringkas deskripsi atau perkecil logo: snapshot melebihi kapasitas satu sel laporan.',
      )
  }
  return {
    errors,
    warnings,
    planned,
    realized: realized.length,
    tanggal_ttd: tanggal_ttd || dates[dates.length - 1],
  }
}

function reportFileName(name, month) {
  monthDates(month)
  const short = [
    'jan',
    'feb',
    'mar',
    'apr',
    'mei',
    'jun',
    'jul',
    'agu',
    'sep',
    'okt',
    'nov',
    'des',
  ][Number(month.slice(5)) - 1]
  const safe =
    String(name)
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 100) || 'Pegawai'
  return `LKB_${safe}_${month.slice(0, 4)}_${short}.pdf`
}
