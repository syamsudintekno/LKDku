/**
 * Code.gs - Router utama dan endpoint doPost Web App
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      message: 'LKD-App Apps Script API Aktif dan Siap.',
      timestamp: nowIso(),
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonError('VALIDATION', 'Body permintaan kosong.')
    }

    var request
    try {
      request = JSON.parse(e.postData.contents)
    } catch (parseErr) {
      return jsonError('VALIDATION', 'Format JSON tidak valid.')
    }

    if (
      !request ||
      typeof request !== 'object' ||
      Array.isArray(request) ||
      typeof request.action !== 'string' ||
      (request.payload !== undefined &&
        (!request.payload || typeof request.payload !== 'object' || Array.isArray(request.payload)))
    ) {
      return jsonError('VALIDATION', 'Format permintaan tidak valid.')
    }
    var action = request.action
    var token = request.token
    var payload = request.payload || {}
    var requestId = request.requestId

    if (!action) {
      return jsonError('VALIDATION', 'Parameter action wajib disertakan.')
    }

    // Aksi publik tanpa token
    if (action === 'auth.login') {
      var loginRes = handle_auth_login(payload)
      return jsonOk(loginRes)
    }

    // Aksi yang membutuhkan token autentikasi
    var session = validateSessionToken(token)
    if (!session) {
      return jsonError(
        'UNAUTHENTICATED',
        'Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.',
      )
    }

    var ctx = {
      userId: session.userId,
      sessionId: session.sessionId,
      requestId: requestId,
    }

    var result
    switch (action) {
      case 'auth.logout':
        result = handle_auth_logout(payload, ctx)
        break

      case 'auth.me':
        result = handle_auth_me(payload, ctx)
        break

      case 'bootstrap':
        result = handle_bootstrap(payload, ctx)
        break

      default:
        return jsonError('NOT_FOUND', 'Aksi belum diimplementasikan: ' + action)
    }

    return jsonOk(result)
  } catch (err) {
    var code = err && err.code ? err.code : 'INTERNAL'
    var knownCodes = [
      'UNAUTHENTICATED',
      'LOCKED',
      'VALIDATION',
      'CONFLICT',
      'FORBIDDEN_STATE',
      'NOT_FOUND',
    ]
    var message =
      knownCodes.indexOf(code) >= 0
        ? err.message
        : 'Terjadi kesalahan internal. Periksa konfigurasi layanan.'
    if (knownCodes.indexOf(code) < 0) code = 'INTERNAL'
    return jsonError(code, message)
  }
}

function handle_bootstrap(payload, ctx) {
  var profileRecords = getSheetRecords('profile')
  var profile = {}
  for (var p = 0; p < profileRecords.length; p++) {
    profile[profileRecords[p].key] = profileRecords[p].value
  }

  var configRecords = getSheetRecords('config')
  var config = {}
  for (var c = 0; c < configRecords.length; c++) {
    try {
      config[configRecords[c].key] = JSON.parse(configRecords[c].value)
    } catch (e) {
      config[configRecords[c].key] = configRecords[c].value
    }
  }

  return {
    profile: profile,
    config: config,
  }
}
