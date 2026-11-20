/**
 * util.gs - Fungsi utilitas, kriptografi, respons JSON, dan Script Properties
 */

function jsonOk(data) {
  var output = JSON.stringify({ ok: true, data: data || {} })
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON)
}

function jsonError(code, message) {
  var output = JSON.stringify({
    ok: false,
    error: { code: code || 'INTERNAL', message: message || 'Terjadi kesalahan internal.' },
  })
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON)
}

function getScriptProp(key) {
  return PropertiesService.getScriptProperties().getProperty(key)
}

function setScriptProp(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value)
}

function getSpreadsheetId() {
  var id = getScriptProp('SPREADSHEET_ID')
  if (!id) {
    throw new Error('SPREADSHEET_ID belum dikonfigurasi di Script Properties.')
  }
  return id
}

function getPepper() {
  var p = getScriptProp('PEPPER')
  if (!p) {
    throw new Error('PEPPER belum dikonfigurasi di Script Properties.')
  }
  return p
}

/**
 * SHA-256 berulang untuk password hashing dengan salt dan pepper.
 */
function hashPassword(password, salt, pepper, iterations) {
  var iters = iterations || 1000
  var input = password + ':' + salt + ':' + pepper
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8,
  )

  for (var i = 1; i < iters; i++) {
    bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
  }

  return bytesToHex(bytes)
}

function hashToken(token) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    token,
    Utilities.Charset.UTF_8,
  )
  return bytesToHex(bytes)
}

function generateToken() {
  return hashToken(Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid())
}

function bytesToHex(bytes) {
  return bytes
    .map(function (byte) {
      var v = (byte < 0 ? byte + 256 : byte).toString(16)
      return v.length === 1 ? '0' + v : v
    })
    .join('')
}

/**
 * Perbandingan konstan (constant-time) untuk mencegah timing attack.
 */
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  var result = 0
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function generateUuid() {
  return Utilities.getUuid()
}

function nowIso() {
  return Utilities.formatDate(new Date(), 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ssXXX")
}
