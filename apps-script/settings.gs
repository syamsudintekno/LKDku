function handle_config_get(payload, ctx) {
  return {
    config: referenceConfig(),
    version: hashToken(JSON.stringify(getSheetRecords('config', true))),
  }
}
function handle_config_update(payload, ctx) {
  return withLock(function () {
    var state = handle_config_get(payload, ctx)
    if (payload.version !== state.version)
      referenceError('CONFLICT', 'Konfigurasi berubah. Muat ulang sebelum menyimpan.')
    var units = payload.satuan_list
    if (
      !Array.isArray(units) ||
      !units.length ||
      units.length > 40 ||
      units.some(function (unit) {
        return (
          typeof unit !== 'string' ||
          !unit.trim() ||
          unit !== unit.trim() ||
          unit.length > 60 ||
          !/^[\p{L}\p{N} _./()-]+$/u.test(unit)
        )
      }) ||
      new Set(
        units.map(function (unit) {
          return unit.toLowerCase()
        }),
      ).size !== units.length
    )
      referenceError('VALIDATION', 'Isi 1–40 satuan unik, maksimal 60 karakter per satuan.')
    var used = getSheetRecords('activity', true)
      .map(function (row) {
        return row.satuan
      })
      .concat(
        getSheetRecords('skp_item', true).map(function (row) {
          return row.satuan_target
        }),
        getSheetRecords('skp_template', true).map(function (row) {
          return row.satuan
        }),
      )
    if (
      used.some(function (unit) {
        return unit && units.indexOf(unit) < 0
      })
    )
      referenceError('VALIDATION', 'Satuan yang masih dipakai data tidak dapat dihapus.')
    var previous = getSheetRecords('config').filter(function (row) {
      return row.key === 'satuan_list'
    })[0]
    var stamp = referenceStamp()
    commitReference('config', [
      Object.assign({}, previous || { id: generateUuid(), created_at: stamp, deleted: 0 }, {
        key: 'satuan_list',
        value: JSON.stringify(units),
        updated_at: stamp,
      }),
    ])
    appendAudit('config.update', 'config', '', 'Daftar satuan diperbarui.')
    return handle_config_get(payload, ctx)
  })
}
function handle_auth_sessions(payload, ctx) {
  return getSheetRecords('sessions')
    .filter(function (row) {
      return row.user_id === ctx.userId && Date.parse(row.expires_at) > Date.now()
    })
    .map(function (row) {
      return {
        id: row.id,
        created_at: row.created_at,
        expires_at: row.expires_at,
        remember: Number(row.remember) === 1,
        current: row.id === ctx.sessionId,
      }
    })
}
function handle_auth_revokeOthers(payload, ctx) {
  return withLock(function () {
    var changes = getSheetRecords('sessions')
      .filter(function (row) {
        return row.user_id === ctx.userId && row.id !== ctx.sessionId
      })
      .map(function (row) {
        return Object.assign({}, row, { deleted: 1, updated_at: referenceStamp() })
      })
    if (changes.length) commitReference('sessions', changes)
    appendAudit('auth.revokeOthers', 'users', ctx.userId, 'Sesi lain diakhiri.')
    return { revoked: changes.length }
  })
}
function handle_auth_changePassword(payload, ctx) {
  return withLock(function () {
    var user = referenceRecord('users', ctx.userId)
    if (Date.parse(user.locked_until) > Date.now())
      referenceError(
        'LOCKED',
        'Penggantian password terkunci sementara. Coba lagi setelah 15 menit.',
      )
    if (
      typeof payload.currentPassword !== 'string' ||
      typeof payload.newPassword !== 'string' ||
      payload.newPassword.length < 12 ||
      payload.newPassword.length > 256 ||
      payload.confirmation !== payload.newPassword
    )
      referenceError(
        'VALIDATION',
        'Isi password saat ini dan password baru 12–256 karakter dengan konfirmasi yang sama.',
      )
    if (
      !constantTimeCompare(
        hashPassword(payload.currentPassword, user.salt, getPepper(), user.iterations || 1000),
        user.password_hash,
      )
    ) {
      var failed =
        (Date.parse(user.locked_until) <= Date.now() ? 0 : Number(user.failed_count) || 0) + 1
      updateSheetRecord('users', user.id, {
        failed_count: failed,
        locked_until: failed >= 5 ? new Date(Date.now() + 900000).toISOString() : '',
      })
      appendAudit(
        'auth.changePassword.failed',
        'users',
        user.id,
        'Verifikasi password saat ini gagal.',
      )
      referenceError(
        failed >= 5 ? 'LOCKED' : 'VALIDATION',
        failed >= 5 ? 'Penggantian password terkunci 15 menit.' : 'Password saat ini tidak cocok.',
      )
    }
    if (payload.newPassword === payload.currentPassword)
      referenceError('VALIDATION', 'Password baru harus berbeda dari password saat ini.')
    var salt = generateUuid(),
      stamp = referenceStamp()
    var changedUser = Object.assign({}, user, {
      salt: salt,
      password_hash: hashPassword(payload.newPassword, salt, getPepper(), user.iterations || 1000),
      failed_count: 0,
      locked_until: '',
      updated_at: stamp,
    })
    commitReference(
      'sessions',
      getSheetRecords('sessions')
        .filter(function (row) {
          return row.user_id === ctx.userId
        })
        .map(function (row) {
          return Object.assign({}, row, { deleted: 1, updated_at: stamp })
        }),
    )
    commitReference('users', [changedUser])
    appendAudit(
      'auth.changePassword',
      'users',
      user.id,
      'Password diperbarui dan seluruh sesi diakhiri.',
    )
    return { success: true }
  })
}
