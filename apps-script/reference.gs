// Shared validation and batched writes for M1. Call commitReference inside withLock.
function referenceError(code, message) {
  throw { code: code, message: message }
}
function referenceText(value, label, required, maxLength) {
  if (value === undefined || value === null) value = ''
  if (typeof value !== 'string' || value.length > (maxLength || 1000))
    referenceError('VALIDATION', label + ' tidak valid atau terlalu panjang.')
  value = value.trim()
  if (required && !value) referenceError('VALIDATION', label + ' wajib diisi.')
  if (value.charAt(0) === '=')
    referenceError('VALIDATION', label + ' tidak boleh diawali tanda sama dengan.')
  return value
}
function referenceNumber(value, label, minimum, maximum, integer) {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())
  )
    referenceError('VALIDATION', label + ' wajib berupa angka.')
  var number = Number(value)
  if (
    !isFinite(number) ||
    number < minimum ||
    number > maximum ||
    (integer && Math.floor(number) !== number)
  )
    referenceError('VALIDATION', label + ' tidak valid.')
  return number
}
function referenceRecord(name, id, includeDeleted) {
  var record = getSheetRecords(name, includeDeleted).filter(function (row) {
    return row.id === id
  })[0]
  if (!record) referenceError('NOT_FOUND', 'Data tidak ditemukan. Muat ulang daftar.')
  return record
}
function referenceVersion(record, payload) {
  if (typeof payload.updated_at !== 'string' || record.updated_at !== payload.updated_at)
    referenceError('CONFLICT', 'Data diubah di tempat lain. Muat ulang sebelum menyimpan.')
}
function referenceStamp() {
  // Per-operation monotonic stamp, including multiple changes within the same millisecond.
  var last = Number(getScriptProp('LAST_REFERENCE_STAMP')) || 0
  var next = Math.max(Date.now(), last + 1)
  setScriptProp('LAST_REFERENCE_STAMP', String(next))
  return new Date(next).toISOString()
}
function commitReference(name, changes) {
  var sheet = getSheet(name)
  var values = sheet.getDataRange().getValues()
  var headers = values[0]
  var idIndex = headers.indexOf('id')
  var used = {}
  for (var r = 1; r < values.length; r++) {
    var change = changes.filter(function (item) {
      return item.id === values[r][idIndex]
    })[0]
    if (change) {
      used[change.id] = true
      headers.forEach(function (header, c) {
        if (change[header] !== undefined) values[r][c] = change[header]
      })
    }
  }
  changes.forEach(function (change) {
    if (!used[change.id])
      values.push(
        headers.map(function (header) {
          return change[header] === undefined ? '' : change[header]
        }),
      )
  })
  if (values.length > 1)
    sheet.getRange(2, 1, values.length - 1, headers.length).setValues(values.slice(1))
}
function saveReference(name, payload, fields, ctx, action) {
  var previous = payload.id ? referenceRecord(name, payload.id) : null
  if (previous) referenceVersion(previous, payload)
  var stamp = referenceStamp()
  var record = Object.assign(
    {},
    previous || { id: generateUuid(), created_at: stamp, deleted: 0 },
    fields,
    { updated_at: stamp },
  )
  commitReference(name, [record])
  appendAudit(action, name, record.id, 'Data referensi diperbarui.')
  return record
}
function assertEditableYear(id) {
  var year = referenceRecord('skp_year', id)
  if (year.status === 'arsip') referenceError('FORBIDDEN_STATE', 'SKP arsip hanya dapat dibaca.')
  return year
}
function referenceConfig() {
  var config = {}
  getSheetRecords('config').forEach(function (row) {
    try {
      config[row.key] = JSON.parse(row.value)
    } catch (error) {
      config[row.key] = row.value
    }
  })
  return config
}
