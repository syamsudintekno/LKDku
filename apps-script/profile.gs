function getProfileState() {
  var rows = getSheetRecords('profile')
  var profile = {}
  rows.forEach(function (row) {
    profile[row.key] = row.value
  })
  return {
    profile: profile,
    version: hashToken(
      JSON.stringify(
        rows.map(function (row) {
          return [row.key, row.value, row.updated_at]
        }),
      ),
    ),
  }
}
function handle_profile_get(payload, ctx) {
  return getProfileState()
}
function handle_profile_update(payload, ctx) {
  return withLock(function () {
    var state = getProfileState()
    if (payload.version !== state.version)
      referenceError('CONFLICT', 'Profil diubah di tempat lain. Muat ulang sebelum menyimpan.')
    var keys = [
      'nama',
      'nip',
      'jabatan',
      'unit_kerja',
      'satuan_kerja',
      'kop_1',
      'kop_2',
      'kop_3',
      'alamat_kop',
      'kota_ttd',
      'atasan_nama',
      'atasan_nip',
      'atasan_jabatan',
      'folder_pdf_id',
      'logo_kop',
    ]
    if (
      !payload.profile ||
      typeof payload.profile !== 'object' ||
      Array.isArray(payload.profile) ||
      Object.keys(payload.profile).some(function (key) {
        return keys.indexOf(key) < 0
      })
    )
      referenceError('VALIDATION', 'Isian profil tidak valid.')
    var profile = {}
    keys.forEach(function (key) {
      if (key === 'logo_kop') {
        var logo = payload.profile[key] || ''
        if (
          typeof logo !== 'string' ||
          logo.length > 20000 ||
          (logo && !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(logo))
        )
          referenceError('VALIDATION', 'Logo harus PNG/JPEG dengan ukuran maksimal 14 KB.')
        profile[key] = logo
      } else profile[key] = referenceText(payload.profile[key], key, false)
    })
    ;['nip', 'atasan_nip'].forEach(function (key) {
      if (profile[key] && !/^\d{18}$/.test(profile[key]))
        referenceError('VALIDATION', 'NIP harus terdiri dari 18 angka atau dikosongkan.')
    })
    if (profile.folder_pdf_id && !/^[a-zA-Z0-9_-]{10,200}$/.test(profile.folder_pdf_id))
      referenceError('VALIDATION', 'ID folder PDF tidak valid.')
    var stamp = referenceStamp()
    var rows = getSheetRecords('profile')
    var changes = keys.map(function (key) {
      var row = rows.filter(function (item) {
        return item.key === key
      })[0]
      return Object.assign({}, row || { id: generateUuid(), created_at: stamp, deleted: 0 }, {
        key: key,
        value: profile[key],
        updated_at: stamp,
      })
    })
    commitReference('profile', changes)
    appendAudit('profile.update', 'profile', ctx.userId, 'Profil diperbarui.')
    return getProfileState()
  })
}
