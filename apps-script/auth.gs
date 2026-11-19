/**
 * auth.gs - Modul autentikasi, token sesi, dan keamanan login
 */

function handle_auth_login(payload) {
  var username = (payload.username || '').trim();
  var password = payload.password || '';
  var remember = !!payload.remember;

  if (!username || !password) {
    throw { code: 'VALIDATION', message: 'Username dan password wajib diisi.' };
  }

  return withLock(function() {
    var users = getSheetRecords('users');
    var user = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].username.toLowerCase() === username.toLowerCase()) {
        user = users[i];
        break;
      }
    }

    if (!user) {
      throw { code: 'UNAUTHENTICATED', message: 'Username atau password salah.' };
    }

    // Cek apakah akun terkunci
    if (user.locked_until) {
      var lockTime = new Date(user.locked_until).getTime();
      var nowTime = new Date().getTime();
      if (lockTime > nowTime) {
        var remainingMin = Math.ceil((lockTime - nowTime) / 60000);
        throw { code: 'LOCKED', message: 'Terlalu banyak percobaan. Akun terkunci. Coba lagi dalam ' + remainingMin + ' menit.' };
      }
    }

    var pepper = getPepper();
    var computedHash = hashPassword(password, user.salt, pepper, user.iterations || 1000);

    if (!constantTimeCompare(computedHash, user.password_hash)) {
      var failed = (Number(user.failed_count) || 0) + 1;
      var update = { failed_count: failed };
      if (failed >= 5) {
        var lockUntil = new Date(new Date().getTime() + 15 * 60 * 1000).toISOString();
        update.locked_until = lockUntil;
      }
      updateSheetRecord('users', user.id, update);
      throw { code: 'UNAUTHENTICATED', message: 'Username atau password salah.' };
    }

    // Login sukses: reset status failed/locked
    updateSheetRecord('users', user.id, {
      failed_count: 0,
      locked_until: '',
      last_login: nowIso()
    });

    // Buat token sesi
    var token = generateToken();
    var tokenHash = hashToken(token);
    var durationHours = remember ? (14 * 24) : 12; // 14 hari atau 12 jam
    var expiresAt = new Date(new Date().getTime() + durationHours * 3600 * 1000).toISOString();

    appendSheetRecord('sessions', {
      token_hash: tokenHash,
      user_id: user.id,
      expires_at: expiresAt,
      remember: remember ? 1 : 0
    });

    // Ambil profil dasar
    var profileRecords = getSheetRecords('profile');
    var profile = {};
    for (var p = 0; p < profileRecords.length; p++) {
      profile[profileRecords[p].key] = profileRecords[p].value;
    }

    return {
      token: token,
      user: {
        id: user.id,
        username: user.username
      },
      profile: profile
    };
  });
}

function validateSessionToken(token) {
  if (!token) return null;
  var tokenHash = hashToken(token);
  var sessions = getSheetRecords('sessions');

  for (var i = 0; i < sessions.length; i++) {
    var sess = sessions[i];
    if (sess.token_hash === tokenHash) {
      var exp = new Date(sess.expires_at).getTime();
      if (exp > new Date().getTime()) {
        return {
          sessionId: sess.id,
          userId: sess.user_id
        };
      }
    }
  }

  return null;
}

function handle_auth_logout(payload, ctx) {
  if (ctx && ctx.sessionId) {
    updateSheetRecord('sessions', ctx.sessionId, { deleted: 1 });
  }
  return { success: true };
}

function handle_auth_me(payload, ctx) {
  var users = getSheetRecords('users');
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === ctx.userId) {
      user = users[i];
      break;
    }
  }

  if (!user) {
    throw { code: 'UNAUTHENTICATED', message: 'Sesi kedaluwarsa atau pengguna tidak ditemukan.' };
  }

  var profileRecords = getSheetRecords('profile');
  var profile = {};
  for (var p = 0; p < profileRecords.length; p++) {
    profile[profileRecords[p].key] = profileRecords[p].value;
  }

  return {
    user: {
      id: user.id,
      username: user.username
    },
    profile: profile
  };
}
