// Generated from src/domain/backup.js. Run node scripts/sync-domain.mjs.

function toBackupCsv(headers, rows) {
  const cell = (value) => {
    let text = String(value ?? '')
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text
    return '"' + text.replaceAll('"', '""') + '"'
  }
  return (
    '\uFEFF' +
    [headers, ...rows.map((row) => headers.map((key) => row[key]))]
      .map((row) => row.map(cell).join(','))
      .join('\r\n')
  )
}
function planBackupImport(document, current, schemas) {
  if (
    !document ||
    document.schemaVersion !== 1 ||
    !document.tables ||
    Array.isArray(document.tables) ||
    Object.keys(document).some(
      (key) => !['schemaVersion', 'exported_at', 'tables', 'headers', 'audit'].includes(key),
    )
  )
    activityError('Format cadangan tidak dikenal.')
  if (JSON.stringify(document).length > 2000000) activityError('Cadangan melebihi batas 2 MB.')
  const changes = {},
    merged = {},
    summary = []
  let count = 0
  const freshTarget =
    ['skp_year', 'skp_item', 'skp_template', 'activity', 'holiday', 'report_month'].every(
      (name) => !(current[name] || []).length,
    ) && (current.profile || []).every((row) => !row.value)
  for (const name of Object.keys(document.tables))
    if (!Object.prototype.hasOwnProperty.call(schemas, name))
      activityError('Cadangan memuat sheet yang tidak boleh dipulihkan.')
  for (const name of Object.keys(schemas)) {
    const rows = document.tables[name] || []
    if (!Array.isArray(rows) || rows.length > 10000)
      activityError('Jumlah baris cadangan tidak valid.')
    const headers = schemas[name],
      known = new Map((current[name] || []).map((row) => [row.id, row])),
      seen = new Set(),
      natural = new Set()
    if (
      document.headers?.[name] &&
      JSON.stringify(document.headers[name]) !== JSON.stringify(headers)
    )
      activityError('Header cadangan berbeda dari aplikasi.')
    changes[name] = []
    merged[name] = [...(current[name] || [])]
    for (const row of rows) {
      if (
        !row ||
        typeof row !== 'object' ||
        Array.isArray(row) ||
        typeof row.id !== 'string' ||
        !row.id.trim() ||
        row.id.length > 200 ||
        seen.has(row.id) ||
        Object.keys(row).some((key) => !headers.includes(key))
      )
        activityError('Baris, ID duplikat, atau kolom cadangan tidak valid.')
      seen.add(row.id)
      for (const value of Object.values(row))
        if (
          !['string', 'number', 'boolean'].includes(typeof value) ||
          (typeof value === 'string' && (/^\s*=/.test(value) || value.length > 50000)) ||
          (typeof value === 'number' && !Number.isFinite(value))
        )
          activityError('Nilai sel cadangan tidak valid.')
      const naturalKey = ['profile', 'config'].includes(name)
        ? row.key
        : name === 'holiday'
          ? row.tanggal
          : name === 'report_month'
            ? `${row.tahun}|${row.bulan}`
            : null
      if (naturalKey && natural.has(naturalKey))
        activityError('Identitas bisnis duplikat dalam cadangan.')
      if (naturalKey) natural.add(naturalKey)
      const equivalent = (other) =>
        headers.every((key) => String(other[key] ?? '') === String(row[key] ?? ''))
      let previous = known.get(row.id)
      if (!previous && naturalKey)
        previous = (current[name] || []).find((other) =>
          ['profile', 'config'].includes(name)
            ? other.key === row.key
            : name === 'holiday'
              ? other.tanggal === row.tanggal
              : Number(other.tahun) === Number(row.tahun) &&
                Number(other.bulan) === Number(row.bulan),
        )
      if (previous) {
        const sameContent =
          equivalent(previous) ||
          (naturalKey &&
            headers
              .filter((key) => !['id', 'created_at', 'updated_at'].includes(key))
              .every((key) => String(previous[key] ?? '') === String(row[key] ?? '')))
        if (sameContent) continue
        if (
          (name === 'profile' &&
            previous.value === '' &&
            previous.deleted != 1 &&
            row.deleted != 1) ||
          (freshTarget &&
            name === 'config' &&
            row.key === 'satuan_list' &&
            previous.value === JSON.stringify(['Kelas', 'Kegiatan', 'Draft', 'Modul', 'Laporan']))
        ) {
          const restored = { ...row, id: previous.id }
          changes[name].push(restored)
          merged[name] = merged[name].map((old) => (old.id === previous.id ? restored : old))
          continue
        }
        activityError(
          'Data yang sudah ada berbeda dari cadangan. Impor tidak menimpa perubahan.',
          'CONFLICT',
        )
      }
      changes[name].push({ ...row })
      merged[name].push({ ...row })
    }
    count += changes[name].length
    summary.push({
      sheet: name,
      added: changes[name].length,
      skipped: rows.length - changes[name].length,
    })
  }
  return { changes, merged, count, summary }
}
