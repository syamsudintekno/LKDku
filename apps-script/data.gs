/**
 * data.gs - Operasi baca/tulis Google Sheets dengan LockService dan batching
 */

function getDbSpreadsheet() {
  var id = getSpreadsheetId();
  return SpreadsheetApp.openById(id);
}

function withLock(callback, timeoutMs) {
  var lock = LockService.getScriptLock();
  var timeout = timeoutMs || 15000;
  var success = lock.tryLock(timeout);
  if (!success) {
    throw { code: 'CONFLICT', message: 'Sistem sedang sibuk. Silakan coba beberapa saat lagi.' };
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function getSheet(sheetName) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw { code: 'NOT_FOUND', message: 'Sheet ' + sheetName + ' tidak ditemukan.' };
  }
  return sheet;
}

/**
 * Membaca semua baris aktif (deleted == 0) dari sheet tertentu dan mengembalikannya sebagai array object
 */
function getSheetRecords(sheetName) {
  var sheet = getSheet(sheetName);
  var values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) {
    return [];
  }

  var headers = values[0];
  var records = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = { _rowIndex: i + 1 };
    for (var h = 0; h < headers.length; h++) {
      obj[headers[h]] = row[h];
    }
    // Hanya ambil data yang belum dihapus (deleted == 0 atau kosong)
    if (obj.deleted != 1) {
      records.push(obj);
    }
  }

  return records;
}

/**
 * Menambahkan 1 baris baru ke sheet secara batch
 */
function appendSheetRecord(sheetName, record) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (!record.id) record.id = generateUuid();
  if (!record.created_at) record.created_at = nowIso();
  if (!record.updated_at) record.updated_at = record.created_at;
  if (record.deleted === undefined) record.deleted = 0;

  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var col = headers[i];
    row.push(record[col] !== undefined ? record[col] : '');
  }

  sheet.appendRow(row);
  return record;
}

/**
 * Mengupdate baris berdasarkan ID
 */
function updateSheetRecord(sheetName, id, updateObj) {
  var sheet = getSheet(sheetName);
  var values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) {
    throw { code: 'NOT_FOUND', message: 'Data tidak ditemukan.' };
  }

  var headers = values[0];
  var idIndex = headers.indexOf('id');
  if (idIndex === -1) {
    throw { code: 'INTERNAL', message: 'Kolom id tidak ditemukan pada sheet ' + sheetName };
  }

  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][idIndex] === id && values[i][headers.indexOf('deleted')] != 1) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw { code: 'NOT_FOUND', message: 'Record dengan ID ' + id + ' tidak ditemukan.' };
  }

  updateObj.updated_at = nowIso();

  var rowValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  for (var h = 0; h < headers.length; h++) {
    var key = headers[h];
    if (updateObj[key] !== undefined) {
      rowValues[h] = updateObj[key];
    }
  }

  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  return updateObj;
}
