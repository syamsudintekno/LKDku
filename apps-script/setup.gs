/**
 * setup.gs - Inisialisasi Google Sheets database, tabel, script properties, dan user awal
 */

function setupInitialProperties() {
  var props = PropertiesService.getScriptProperties()
  getSpreadsheetId() // Pemilik mengisi Script Properties, tidak pernah ditulis di source.

  var existingPepper = props.getProperty('PEPPER')
  if (!existingPepper) {
    var randomPepper = Utilities.getUuid() + '-' + Utilities.getUuid()
    props.setProperty('PEPPER', randomPepper)
  }

  Logger.log('Script Properties berhasil diset: SPREADSHEET_ID terhubung.')
}

function initSheets() {
  return withLock(function () {
    setupInitialProperties()
    var ss = getDbSpreadsheet()

    var sheetSchemas = {
      users: [
        'id',
        'created_at',
        'updated_at',
        'deleted',
        'username',
        'password_hash',
        'salt',
        'iterations',
        'failed_count',
        'locked_until',
        'last_login',
      ],
      sessions: [
        'id',
        'created_at',
        'updated_at',
        'deleted',
        'token_hash',
        'user_id',
        'expires_at',
        'remember',
      ],
      profile: ['id', 'created_at', 'updated_at', 'deleted', 'key', 'value'],
      skp_year: ['id', 'created_at', 'updated_at', 'deleted', 'tahun', 'status', 'catatan'],
      skp_item: [
        'id',
        'created_at',
        'updated_at',
        'deleted',
        'skp_year_id',
        'kode',
        'unsur',
        'rencana_hasil_kerja',
        'indikator',
        'target_tahunan',
        'satuan_target',
        'catatan',
        'aktif',
      ],
      skp_template: [
        'id',
        'created_at',
        'updated_at',
        'deleted',
        'skp_item_id',
        'deskripsi',
        'hari',
        'frekuensi',
        'tgl_mulai',
        'tgl_akhir',
        'jam_mulai',
        'jam_selesai',
        'jumlah',
        'satuan',
        'pengecualian',
        'urutan',
      ],
      activity: [
        'id',
        'created_at',
        'updated_at',
        'deleted',
        'tanggal',
        'deskripsi',
        'unsur',
        'jumlah',
        'satuan',
        'jam_mulai',
        'jam_selesai',
        'skp_item_id',
        'template_id',
        'generated_key',
        'sumber',
        'alasan_insidental',
        'status',
        'bukti_url',
        'catatan',
      ],
      holiday: ['id', 'created_at', 'updated_at', 'deleted', 'tanggal', 'keterangan', 'jenis'],
      report_month: [
        'id',
        'created_at',
        'updated_at',
        'deleted',
        'tahun',
        'bulan',
        'status',
        'tanggal_ttd',
        'pdf_file_id',
        'pdf_url',
        'snapshot_json',
        'finalized_at',
      ],
      audit_log: [
        'id',
        'created_at',
        'updated_at',
        'deleted',
        'waktu',
        'aksi',
        'entitas',
        'entitas_id',
        'ringkasan',
      ],
      config: ['id', 'created_at', 'updated_at', 'deleted', 'key', 'value'],
    }

    for (var name in sheetSchemas) {
      var headers = sheetSchemas[name]
      var sheet = ss.getSheetByName(name)
      if (!sheet) {
        sheet = ss.insertSheet(name)
        sheet.appendRow(headers)
        sheet
          .getRange(1, 1, 1, headers.length)
          .setFontWeight('bold')
          .setBackground('#1f5f5b')
          .setFontColor('#ffffff')
        sheet.setFrozenRows(1)
      }
    }

    // Inisialisasi Data Profil Dasar (jika belum ada)
    var profileRecords = getSheetRecords('profile')
    if (profileRecords.length === 0) {
      var defaultProfiles = [
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
      ].map(function (key) {
        return { key: key, value: '' }
      })

      for (var p = 0; p < defaultProfiles.length; p++) {
        appendSheetRecord('profile', defaultProfiles[p])
      }
    }

    // Inisialisasi Config Dasar (jika belum ada)
    var configRecords = getSheetRecords('config')
    if (configRecords.length === 0) {
      appendSheetRecord('config', {
        key: 'unsur_list',
        value: JSON.stringify(['Pendidikan', 'Penelitian', 'Pengabdian', 'Penunjang']),
      })
      appendSheetRecord('config', {
        key: 'satuan_list',
        value: JSON.stringify(['Kelas', 'Kegiatan', 'Draft', 'Modul', 'Laporan']),
      })
    }

    Logger.log('initSheets() selesai. Sheet dan konfigurasi awal berhasil dibuat.')
  })
}

function setupUser(username, password) {
  var props = PropertiesService.getScriptProperties()
  var u = username === undefined ? props.getProperty('INITIAL_USERNAME') : username
  var p = password === undefined ? props.getProperty('INITIAL_PASSWORD') : password
  if (typeof u !== 'string' || !u.trim() || typeof p !== 'string' || p.length < 12) {
    throw {
      code: 'VALIDATION',
      message: 'Isi username dan password minimal 12 karakter untuk membuat akun.',
    }
  }
  u = u.trim()
  return withLock(function () {
    setupInitialProperties()
    var pepper = getPepper()
    var salt = Utilities.getUuid()
    var hash = hashPassword(p, salt, pepper, 1000)

    var users = getSheetRecords('users')
    var existing = null
    for (var i = 0; i < users.length; i++) {
      if (users[i].username.toLowerCase() === u.toLowerCase()) {
        existing = users[i]
        break
      }
    }

    if (existing) {
      updateSheetRecord('users', existing.id, {
        password_hash: hash,
        salt: salt,
        iterations: 1000,
        failed_count: 0,
        locked_until: '',
      })
      getSheetRecords('sessions')
        .filter(function (session) {
          return session.user_id === existing.id
        })
        .forEach(function (session) {
          updateSheetRecord('sessions', session.id, { deleted: 1 })
        })
      Logger.log('Akun berhasil diperbarui. Semua sesi lama diakhiri.')
      props.deleteProperty('INITIAL_PASSWORD')
      props.deleteProperty('INITIAL_USERNAME')
      return { ok: true, message: 'Akun berhasil diperbarui.' }
    } else {
      appendSheetRecord('users', {
        username: u,
        password_hash: hash,
        salt: salt,
        iterations: 1000,
        failed_count: 0,
        locked_until: '',
        last_login: '',
      })
      Logger.log('Akun berhasil dibuat.')
      props.deleteProperty('INITIAL_PASSWORD')
      props.deleteProperty('INITIAL_USERNAME')
      return { ok: true, message: 'Akun berhasil dibuat.' }
    }
  })
}
