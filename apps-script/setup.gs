/**
 * setup.gs - Inisialisasi Google Sheets database, tabel, script properties, dan user awal
 */

function setupInitialProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', '1Wv84-Ur8MiyYpUKtOUXlVFU1FF9W3cHTFWXwHX3RBkM');

  var existingPepper = props.getProperty('PEPPER');
  if (!existingPepper) {
    var randomPepper = Utilities.getUuid() + '-' + Utilities.getUuid();
    props.setProperty('PEPPER', randomPepper);
  }

  Logger.log('Script Properties berhasil diset: SPREADSHEET_ID terhubung.');
}

function initSheets() {
  setupInitialProperties();
  var ss = getDbSpreadsheet();

  var sheetSchemas = {
    users: ['id', 'created_at', 'updated_at', 'deleted', 'username', 'password_hash', 'salt', 'iterations', 'failed_count', 'locked_until', 'last_login'],
    sessions: ['id', 'created_at', 'updated_at', 'deleted', 'token_hash', 'user_id', 'expires_at', 'remember'],
    profile: ['id', 'created_at', 'updated_at', 'deleted', 'key', 'value'],
    skp_year: ['id', 'created_at', 'updated_at', 'deleted', 'tahun', 'status', 'catatan'],
    skp_item: ['id', 'created_at', 'updated_at', 'deleted', 'skp_year_id', 'kode', 'unsur', 'rencana_hasil_kerja', 'indikator', 'target_tahunan', 'satuan_target', 'catatan', 'aktif'],
    skp_template: ['id', 'created_at', 'updated_at', 'deleted', 'skp_item_id', 'deskripsi', 'hari', 'frekuensi', 'tgl_mulai', 'tgl_akhir', 'jam_mulai', 'jam_selesai', 'jumlah', 'satuan', 'pengecualian', 'urutan'],
    activity: ['id', 'created_at', 'updated_at', 'deleted', 'tanggal', 'deskripsi', 'unsur', 'jumlah', 'satuan', 'jam_mulai', 'jam_selesai', 'skp_item_id', 'template_id', 'generated_key', 'sumber', 'alasan_insidental', 'status', 'bukti_url', 'catatan'],
    holiday: ['id', 'created_at', 'updated_at', 'deleted', 'tanggal', 'keterangan', 'jenis'],
    report_month: ['id', 'created_at', 'updated_at', 'deleted', 'tahun', 'bulan', 'status', 'tanggal_ttd', 'pdf_file_id', 'pdf_url', 'snapshot_json', 'finalized_at'],
    audit_log: ['id', 'created_at', 'updated_at', 'deleted', 'waktu', 'aksi', 'entitas', 'entitas_id', 'ringkasan'],
    config: ['id', 'created_at', 'updated_at', 'deleted', 'key', 'value']
  };

  for (var name in sheetSchemas) {
    var headers = sheetSchemas[name];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1f5f5b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }

  // Hapus tab bawaan Sheet1 jika ada
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      Logger.log('Tidak dapat menghapus Sheet1: ' + e.message);
    }
  }

  // Inisialisasi Data Profil Dasar (jika belum ada)
  var profileRecords = getSheetRecords('profile');
  if (profileRecords.length === 0) {
    var defaultProfiles = [
      { key: 'nama', value: 'Ahmad Syamsudin, M.Kom.' },
      { key: 'nip', value: '198809022015031004' },
      { key: 'jabatan', value: 'Lektor - Penata Tingkat I / III-d' },
      { key: 'unit_kerja', value: 'Fakultas Tarbiyah dan Ilmu Keguruan / Tadris Matematika' },
      { key: 'satuan_kerja', value: 'Universitas Islam Negeri (UIN) Syekh Wasil Kediri' },
      { key: 'kop_1', value: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' },
      { key: 'kop_2', value: 'UNIVERSITAS ISLAM NEGERI SYEKH WASIL KEDIRI' },
      { key: 'kop_3', value: 'Jalan Sunan Ampel Nomor 07 Ngronggo Kota Kediri Kode Pos 64127' },
      { key: 'alamat_kop', value: 'Telepon (0354) 689282 Faksimile (0354) 686564 Website: www.uinkediri.ac.id' },
      { key: 'kota_ttd', value: 'Kediri' },
      { key: 'atasan_nama', value: 'Prof. Dr. Dra. Hj. Munifah, M.Pd.' },
      { key: 'atasan_nip', value: '197004121994032006' },
      { key: 'atasan_jabatan', value: 'Dekan Fakultas Tarbiyah dan Ilmu Keguruan' },
      { key: 'folder_pdf_id', value: '1mol1JCXMj0gUQsu3ddsgw-jiD04nNsEY' }
    ];

    for (var p = 0; p < defaultProfiles.length; p++) {
      appendSheetRecord('profile', defaultProfiles[p]);
    }
  }

  // Inisialisasi Config Dasar (jika belum ada)
  var configRecords = getSheetRecords('config');
  if (configRecords.length === 0) {
    appendSheetRecord('config', { key: 'unsur_list', value: JSON.stringify(['Pendidikan', 'Penelitian', 'Pengabdian', 'Penunjang']) });
    appendSheetRecord('config', { key: 'satuan_list', value: JSON.stringify(['Kelas', 'Kegiatan', 'Draft', 'Modul', 'Laporan']) });
  }

  Logger.log('initSheets() selesai. Seluruh 11 sheet dan konfigurasi awal berhasil dibuat.');
}

function setupUser(username, password) {
  var u = (username || 'syam').trim();
  var p = password || 'Admin123!';

  setupInitialProperties();
  var pepper = getPepper();
  var salt = Utilities.getUuid();
  var hash = hashPassword(p, salt, pepper, 1000);

  var users = getSheetRecords('users');
  var existing = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].username.toLowerCase() === u.toLowerCase()) {
      existing = users[i];
      break;
    }
  }

  if (existing) {
    updateSheetRecord('users', existing.id, {
      password_hash: hash,
      salt: salt,
      iterations: 1000,
      failed_count: 0,
      locked_until: ''
    });
    Logger.log('User ' + u + ' berhasil diperbarui.');
    return { ok: true, message: 'User ' + u + ' berhasil diperbarui.' };
  } else {
    appendSheetRecord('users', {
      username: u,
      password_hash: hash,
      salt: salt,
      iterations: 1000,
      failed_count: 0,
      locked_until: '',
      last_login: ''
    });
    Logger.log('User ' + u + ' berhasil dibuat.');
    return { ok: true, message: 'User ' + u + ' berhasil dibuat.' };
  }
}
