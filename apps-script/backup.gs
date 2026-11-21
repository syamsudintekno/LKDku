function backupNames() {
  return [
    'profile',
    'config',
    'skp_year',
    'skp_item',
    'skp_template',
    'holiday',
    'activity',
    'report_month',
  ]
}
function backupSchemas() {
  var schemas = {}
  backupNames().forEach(function (name) {
    var sheet = getSheet(name)
    schemas[name] = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  })
  return schemas
}
function backupRows(name, headers) {
  return getSheetRecords(name, true).map(function (row) {
    var clean = {}
    headers.forEach(function (key) {
      clean[key] = row[key] === undefined ? '' : row[key]
    })
    return clean
  })
}
function backupState() {
  var headers = backupSchemas(),
    tables = {}
  backupNames().forEach(function (name) {
    tables[name] = backupRows(name, headers[name])
  })
  return { headers: headers, tables: tables }
}
function handle_backup_export(payload, ctx) {
  return withLock(function () {
    if (payload.format === 'csv') {
      if (backupNames().concat(['audit_log']).indexOf(payload.sheet) < 0)
        referenceError('VALIDATION', 'Pilih sheet bisnis yang tersedia.')
      var sheet = getSheet(payload.sheet),
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      return {
        filename: 'LKB_' + payload.sheet + '.csv',
        content: toBackupCsv(headers, backupRows(payload.sheet, headers)),
      }
    }
    if (payload.format && payload.format !== 'json')
      referenceError('VALIDATION', 'Format cadangan tidak dikenal.')
    var state = backupState()
    return {
      document: {
        schemaVersion: 1,
        exported_at: nowIso(),
        headers: state.headers,
        tables: state.tables,
        audit: getSheetRecords('audit_log').map(function (row) {
          return {
            waktu: row.waktu,
            aksi: row.aksi,
            entitas: row.entitas,
            ringkasan: row.ringkasan,
          }
        }),
      },
    }
  })
}
function validateBackupBusiness(tables) {
  var active = function (name) {
    return tables[name].filter(function (row) {
      return row.deleted != 1
    })
  }
  backupNames().forEach(function (name) {
    tables[name].forEach(function (row) {
      if (
        !['0', '1'].includes(String(row.deleted)) ||
        typeof row.created_at !== 'string' ||
        !Number.isFinite(Date.parse(row.created_at)) ||
        typeof row.updated_at !== 'string' ||
        !Number.isFinite(Date.parse(row.updated_at))
      )
        referenceError('VALIDATION', 'Metadata baris cadangan tidak valid.')
    })
  })
  var profileKeys = [
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
  active('profile').forEach(function (row) {
    if (profileKeys.indexOf(row.key) < 0)
      referenceError('VALIDATION', 'Key profil cadangan tidak dikenal.')
    if (row.key === 'logo_kop') {
      if (
        typeof row.value !== 'string' ||
        row.value.length > 20000 ||
        (row.value && !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(row.value))
      )
        referenceError('VALIDATION', 'Logo cadangan tidak valid.')
    } else referenceText(row.value, 'Profil cadangan', false)
    if (['nip', 'atasan_nip'].includes(row.key) && row.value && !/^\d{18}$/.test(row.value))
      referenceError('VALIDATION', 'NIP cadangan tidak valid.')
    if (row.key === 'folder_pdf_id' && row.value && !/^[A-Za-z0-9_-]{10,200}$/.test(row.value))
      referenceError('VALIDATION', 'Folder PDF cadangan tidak valid.')
  })
  var config = {}
  active('config').forEach(function (row) {
    if (!['unsur_list', 'satuan_list'].includes(row.key))
      referenceError('VALIDATION', 'Key konfigurasi cadangan tidak dikenal.')
    try {
      config[row.key] = JSON.parse(row.value)
    } catch (error) {
      referenceError('VALIDATION', 'Konfigurasi cadangan bukan JSON valid.')
    }
  })
  if (
    !Array.isArray(config.unsur_list) ||
    JSON.stringify(config.unsur_list) !==
      JSON.stringify(['Pendidikan', 'Penelitian', 'Pengabdian', 'Penunjang']) ||
    !Array.isArray(config.satuan_list) ||
    !config.satuan_list.length ||
    config.satuan_list.length > 40 ||
    config.satuan_list.some(function (unit) {
      return (
        typeof unit !== 'string' ||
        !unit.trim() ||
        unit.length > 60 ||
        !/^[\p{L}\p{N} _./()-]+$/u.test(unit)
      )
    }) ||
    new Set(
      config.satuan_list.map(function (unit) {
        return unit.toLowerCase()
      }),
    ).size !== config.satuan_list.length
  )
    referenceError('VALIDATION', 'Daftar unsur/satuan cadangan tidak valid.')
  var parent = function (name, id) {
    var found = tables[name].filter(function (row) {
      return row.id === id
    })[0]
    if (!found) referenceError('VALIDATION', 'Relasi parent pada cadangan tidak ditemukan.')
    return found
  }
  var activeYears = new Set(),
    codes = new Set(),
    keys = new Set(),
    months = new Set()
  tables.skp_year.forEach(function (row) {
    referenceNumber(row.tahun, 'Tahun SKP', 1900, 2200, true)
    if (!['draft', 'aktif', 'arsip'].includes(row.status))
      referenceError('VALIDATION', 'Status SKP cadangan tidak valid.')
    if (row.deleted != 1 && row.status === 'aktif') {
      if (activeYears.has(Number(row.tahun))) referenceError('VALIDATION', 'SKP aktif duplikat.')
      activeYears.add(Number(row.tahun))
    }
  })
  tables.skp_item.forEach(function (row) {
    parent('skp_year', row.skp_year_id)
    referenceText(row.kode, 'Kode SKP', true, 80)
    referenceText(row.rencana_hasil_kerja, 'Rencana hasil kerja', true)
    referenceText(row.indikator, 'Indikator', true)
    referenceNumber(row.target_tahunan, 'Target', 0.000001, 1e9, false)
    referenceNumber(row.aktif, 'Aktif', 0, 1, true)
    if (!config.unsur_list.includes(row.unsur) || !config.satuan_list.includes(row.satuan_target))
      referenceError('VALIDATION', 'Unsur/satuan SKP cadangan tidak valid.')
    var key = row.skp_year_id + '|' + row.kode.toLowerCase()
    if (row.deleted != 1 && codes.has(key)) referenceError('VALIDATION', 'Kode SKP duplikat.')
    if (row.deleted != 1) codes.add(key)
  })
  tables.skp_template.forEach(function (row) {
    var item = parent('skp_item', row.skp_item_id),
      year = parent('skp_year', item.skp_year_id)
    validateTemplateSchedule(row)
    referenceText(row.deskripsi, 'Deskripsi template', true)
    referenceNumber(row.jumlah, 'Jumlah template', 0.000001, 1e9, false)
    referenceNumber(row.urutan, 'Urutan template', 1, 10000, true)
    if (
      Number(row.tgl_mulai.slice(0, 4)) !== Number(year.tahun) ||
      Number(row.tgl_akhir.slice(0, 4)) !== Number(year.tahun) ||
      !config.satuan_list.includes(row.satuan)
    )
      referenceError('VALIDATION', 'Tahun/satuan template cadangan tidak valid.')
  })
  var refs = {
    years: tables.skp_year,
    items: tables.skp_item,
    templates: tables.skp_template,
    config: config,
  }
  tables.activity.forEach(function (row) {
    validateActivity(row, refs, row)
    if (row.generated_key) {
      if (keys.has(row.generated_key)) referenceError('VALIDATION', 'Kunci generator duplikat.')
      keys.add(row.generated_key)
    }
  })
  tables.holiday.forEach(function (row) {
    if (!isIsoDate(row.tanggal) || !['nasional', 'cuti_bersama', 'kampus'].includes(row.jenis))
      referenceError('VALIDATION', 'Hari libur cadangan tidak valid.')
    referenceText(row.keterangan, 'Keterangan libur', true)
  })
  tables.report_month.forEach(function (row) {
    var month =
      referenceNumber(row.tahun, 'Tahun laporan', 1900, 2200, true) +
      '-' +
      String(referenceNumber(row.bulan, 'Bulan laporan', 1, 12, true)).padStart(2, '0')
    if (!['draft', 'final'].includes(row.status) || !isIsoDate(row.tanggal_ttd))
      referenceError('VALIDATION', 'Laporan cadangan tidak valid.')
    if (row.deleted != 1 && months.has(month))
      referenceError('VALIDATION', 'Bulan laporan duplikat.')
    if (row.deleted != 1) months.add(month)
    if (row.snapshot_json) {
      var snapshot
      try {
        snapshot = JSON.parse(row.snapshot_json)
      } catch (error) {
        referenceError('VALIDATION', 'Snapshot cadangan tidak valid.')
      }
      if (
        !snapshot.report ||
        snapshot.report.schemaVersion !== 1 ||
        snapshot.report.month !== month ||
        !Array.isArray(snapshot.report.rows) ||
        !snapshot.validation ||
        !Array.isArray(snapshot.validation.errors) ||
        !Array.isArray(snapshot.validation.warnings) ||
        typeof snapshot.sourceVersion !== 'string'
      )
        referenceError('VALIDATION', 'Struktur snapshot cadangan tidak dikenal.')
      if (
        !snapshot.report.profile ||
        typeof snapshot.report.profile !== 'object' ||
        Array.isArray(snapshot.report.profile) ||
        Object.keys(snapshot.report.profile).some(function (key) {
          var value = snapshot.report.profile[key]
          return (
            profileKeys.indexOf(key) < 0 ||
            typeof value !== 'string' ||
            value.length > (key === 'logo_kop' ? 20000 : 1000) ||
            (key === 'logo_kop' &&
              value &&
              !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value))
          )
        }) ||
        snapshot.validation.errors.length ||
        snapshot.validation.warnings.some(function (issue) {
          return (
            !issue ||
            typeof issue.code !== 'string' ||
            typeof issue.message !== 'string' ||
            (issue.tanggal && !isIsoDate(issue.tanggal))
          )
        })
      )
        referenceError('VALIDATION', 'Profil atau pemeriksaan snapshot tidak valid.')
      var snapshotIds = new Set()
      snapshot.report.rows.forEach(function (day) {
        if (day && Array.isArray(day.records))
          day.records.forEach(function (record) {
            if (!record || typeof record.id !== 'string')
              referenceError('VALIDATION', 'Identitas sumber snapshot tidak valid.')
            var source = parent('activity', record.id)
            if (
              row.status === 'final' &&
              (source.deleted == 1 ||
                source.status !== 'terealisasi' ||
                source.tanggal !== day.tanggal ||
                activityDescription(source) !== record.deskripsi_laporan ||
                source.unsur !== record.unsur ||
                source.satuan !== record.satuan ||
                Number(source.jumlah) !== Number(record.jumlah) ||
                source.sumber !== record.sumber)
            )
              referenceError(
                'VALIDATION',
                'Snapshot final tidak sesuai dengan kegiatan sumber pada cadangan.',
              )
          })
      })
      if (
        snapshot.report.rows.some(function (day) {
          return (
            !day ||
            !['activity', 'holiday'].includes(day.kind) ||
            !isIsoDate(day.tanggal) ||
            day.tanggal.slice(0, 7) !== month ||
            !Array.isArray(day.records) ||
            (day.kind === 'holiday' && day.records.length) ||
            day.records.some(function (record) {
              if (
                !record ||
                typeof record.id !== 'string' ||
                !record.id ||
                snapshotIds.has(record.id) ||
                typeof record.deskripsi_laporan !== 'string' ||
                record.deskripsi_laporan.length > 2200 ||
                !['skp', 'insidental'].includes(record.sumber)
              )
                return true
              snapshotIds.add(record.id)
              return false
            })
          )
        })
      )
        referenceError('VALIDATION', 'Tanggal atau identitas baris snapshot tidak valid.')
      var frozen = buildReport({
        month: month,
        records: snapshot.report.rows.flatMap(function (day) {
          return day.records.map(function (record) {
            return Object.assign({}, record, {
              tanggal: day.tanggal,
              deskripsi: record.deskripsi_laporan,
              status: 'terealisasi',
              jam_mulai: '',
              jam_selesai: '',
              created_at: '',
            })
          })
        }),
        holidays: snapshot.report.rows
          .filter(function (day) {
            return day.kind === 'holiday'
          })
          .map(function (day) {
            return { tanggal: day.tanggal }
          }),
        profile: snapshot.report.profile,
        tanggal_ttd: snapshot.report.tanggal_ttd,
      })
      if (
        snapshot.report.rows.some(function (day) {
          return (
            !isIsoDate(day.tanggal) ||
            day.records.some(function (record) {
              return (
                record.status !== 'terealisasi' ||
                !config.unsur_list.includes(record.unsur) ||
                !config.satuan_list.includes(record.satuan) ||
                !Number.isFinite(Number(record.jumlah)) ||
                Number(record.jumlah) <= 0
              )
            })
          )
        }) ||
        JSON.stringify(
          frozen.rows.map(function (day) {
            return [
              day.tanggal,
              day.kind,
              day.records.map(function (record) {
                return [
                  record.id,
                  record.nomor,
                  record.deskripsi_laporan,
                  record.unsur,
                  Number(record.jumlah),
                  record.satuan,
                  record.status,
                  record.sumber,
                ]
              }),
            ]
          }),
        ) !==
          JSON.stringify(
            snapshot.report.rows.map(function (day) {
              return [
                day.tanggal,
                day.kind,
                day.records.map(function (record) {
                  return [
                    record.id,
                    record.nomor,
                    record.deskripsi_laporan,
                    record.unsur,
                    Number(record.jumlah),
                    record.satuan,
                    record.status,
                    record.sumber,
                  ]
                }),
              ]
            }),
          )
      )
        referenceError('VALIDATION', 'Baris snapshot cadangan tidak valid.')
    } else if (row.status === 'final')
      referenceError('VALIDATION', 'Laporan final harus memiliki snapshot.')
    if (row.pdf_url && !/^https:\/\/drive\.google\.com\//.test(row.pdf_url))
      referenceError('VALIDATION', 'Tautan PDF cadangan tidak valid.')
  })
}
function handle_backup_import(payload, ctx) {
  return withLock(function () {
    if (getScriptProp('BACKUP_RECOVERY_REQUIRED'))
      referenceError(
        'FORBIDDEN_STATE',
        'Pemulihan sebelumnya memerlukan pemeriksaan pemilik. Jangan mengimpor ulang sebelum data diperiksa.',
      )
    if (typeof payload.dryRun !== 'boolean')
      referenceError('VALIDATION', 'Pilih pratinjau atau konfirmasi impor.')
    var state = backupState(),
      document = payload.document
    if (
      !document ||
      !document.tables ||
      backupNames().some(function (name) {
        return !Object.prototype.hasOwnProperty.call(document.tables, name)
      }) ||
      !document.headers ||
      Object.keys(document.headers).some(function (name) {
        return backupNames().indexOf(name) < 0
      })
    )
      referenceError('VALIDATION', 'Cadangan harus memuat seluruh sheet bisnis dan headernya.')
    var plan = planBackupImport(document, state.tables, state.headers)
    validateBackupBusiness(plan.merged)
    if (
      plan.changes.report_month.some(function (report) {
        var month = Number(report.tahun) + '-' + String(Number(report.bulan)).padStart(2, '0')
        return (
          report.status === 'final' &&
          state.tables.activity.some(function (row) {
            return (
              row.deleted != 1 &&
              row.tanggal.slice(0, 7) === month &&
              !document.tables.activity.some(function (imported) {
                return imported.id === row.id
              })
            )
          })
        )
      })
    )
      referenceError(
        'CONFLICT',
        'Bulan tujuan memiliki kegiatan tambahan yang tidak ada dalam cadangan. Impor tidak menguncinya sebagai final.',
      )
    var finalMonths = new Set(
      getSheetRecords('report_month')
        .filter(function (row) {
          return row.status === 'final'
        })
        .map(function (row) {
          return Number(row.tahun) + '-' + String(Number(row.bulan)).padStart(2, '0')
        }),
    )
    if (
      plan.changes.activity.some(function (row) {
        return finalMonths.has(row.tanggal.slice(0, 7))
      }) ||
      plan.changes.report_month.some(function (row) {
        return finalMonths.has(Number(row.tahun) + '-' + String(Number(row.bulan)).padStart(2, '0'))
      })
    )
      referenceError('FORBIDDEN_STATE', 'Impor tidak boleh mengubah bulan final yang sudah ada.')
    var version = hashToken(JSON.stringify({ state: state, document: document }))
    if (payload.dryRun) return { version: version, count: plan.count, summary: plan.summary }
    if (payload.confirmed !== true)
      referenceError('VALIDATION', 'Konfirmasikan hasil pratinjau sebelum pemulihan.')
    if (payload.version !== version)
      referenceError('CONFLICT', 'Data atau berkas berubah setelah pratinjau. Periksa ulang impor.')
    var attempted = []
    try {
      backupNames().forEach(function (name) {
        if (plan.changes[name].length) {
          attempted.push(name)
          commitReference(name, plan.changes[name])
        }
      })
      appendAudit(
        'backup.import',
        'backup',
        '',
        plan.count + ' record bisnis dipulihkan tanpa menimpa record berbeda.',
      )
    } catch (error) {
      var failed = false
      attempted.reverse().forEach(function (name) {
        try {
          var sheet = getSheet(name),
            headers = state.headers[name],
            old = state.tables[name],
            last = sheet.getLastRow()
          if (old.length)
            writeSheetRows(
              sheet,
              headers,
              2,
              old.map(function (row) {
                return headers.map(function (key) {
                  return row[key]
                })
              }),
            )
          if (last > old.length + 1)
            sheet.getRange(old.length + 2, 1, last - old.length - 1, headers.length).clearContent()
        } catch (rollbackError) {
          failed = true
        }
      })
      if (failed) {
        setScriptProp('BACKUP_RECOVERY_REQUIRED', '1')
        referenceError(
          'CONFLICT',
          'Rollback pemulihan belum lengkap. Pemilik perlu memeriksa spreadsheet sebelum melanjutkan.',
        )
      }
      throw error
    }
    return { count: plan.count, summary: plan.summary }
  })
}
