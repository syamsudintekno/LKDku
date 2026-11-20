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

      case 'profile.get':
        result = handle_profile_get(payload, ctx)
        break
      case 'profile.update':
        result = handle_profile_update(payload, ctx)
        break
      case 'skp.year.list':
        result = handle_skp_year_list(payload, ctx)
        break
      case 'skp.year.upsert':
        result = handle_skp_year_upsert(payload, ctx)
        break
      case 'skp.item.list':
        result = handle_skp_item_list(payload, ctx)
        break
      case 'skp.item.upsert':
        result = handle_skp_item_upsert(payload, ctx)
        break
      case 'skp.item.delete':
        result = handle_skp_item_delete(payload, ctx)
        break
      case 'skp.item.restore':
        result = handle_skp_item_restore(payload, ctx)
        break
      case 'skp.template.list':
        result = handle_skp_template_list(payload, ctx)
        break
      case 'skp.template.upsert':
        result = handle_skp_template_upsert(payload, ctx)
        break
      case 'skp.template.preview':
        result = handle_skp_template_preview(payload, ctx)
        break
      case 'skp.template.delete':
        result = handle_skp_template_delete(payload, ctx)
        break
      case 'skp.template.restore':
        result = handle_skp_template_restore(payload, ctx)
        break
      case 'holiday.list':
        result = handle_holiday_list(payload, ctx)
        break
      case 'holiday.upsert':
        result = handle_holiday_upsert(payload, ctx)
        break
      case 'holiday.import':
        result = handle_holiday_import(payload, ctx)
        break
      case 'holiday.delete':
        result = handle_holiday_delete(payload, ctx)
        break
      case 'holiday.restore':
        result = handle_holiday_restore(payload, ctx)
        break

      case 'plan.generate':
        result = handle_plan_generate(payload, ctx)
        break
      case 'activity.list':
        result = handle_activity_list(payload, ctx)
        break
      case 'activity.upsert':
        result = handle_activity_upsert(payload, ctx)
        break
      case 'activity.bulkStatus':
        result = handle_activity_bulkStatus(payload, ctx)
        break
      case 'activity.delete':
        result = handle_activity_delete(payload, ctx)
        break
      case 'activity.restore':
        result = handle_activity_restore(payload, ctx)
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
  var tahun =
    payload.tahun === undefined
      ? Number(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy'))
      : referenceNumber(payload.tahun, 'Tahun', 1900, 2200, true)
  var state = getProfileState()
  return {
    profile: state.profile,
    profileVersion: state.version,
    config: referenceConfig(),
    years: getSheetRecords('skp_year'),
    items: getSheetRecords('skp_item'),
    templates: getSheetRecords('skp_template'),
    holidays: getSheetRecords('holiday').filter(function (row) {
      return Number(row.tanggal.slice(0, 4)) === tahun
    }),
    tahun: tahun,
  }
}
