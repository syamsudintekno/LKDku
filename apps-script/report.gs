function reportRecord(month) {
  monthDates(month)
  var matches = getSheetRecords('report_month').filter(function (row) {
    return (
      Number(row.tahun) === Number(month.slice(0, 4)) &&
      Number(row.bulan) === Number(month.slice(5))
    )
  })
  if (matches.length > 1)
    referenceError(
      'CONFLICT',
      'Ada lebih dari satu laporan untuk bulan ini. Periksa data sebelum melanjutkan.',
    )
  return matches[0] || null
}
function reportInput(payload) {
  monthDates(payload.month)
  return {
    month: payload.month,
    records: getSheetRecords('activity').filter(function (row) {
      return row.tanggal.slice(0, 7) === payload.month
    }),
    holidays: getSheetRecords('holiday'),
    profile: getProfileState().profile,
    references: activityReferences(),
    tanggal_ttd: payload.tanggal_ttd,
  }
}
function reportState(payload) {
  var record = reportRecord(payload.month)
  if (record && record.status === 'final') {
    var snapshot = JSON.parse(record.snapshot_json)
    return {
      record: record,
      report: snapshot.report,
      validation: snapshot.validation,
      version: snapshot.sourceVersion,
      final: true,
    }
  }
  var input = reportInput(payload)
  var validation = validateReport(input)
  input.tanggal_ttd = validation.tanggal_ttd
  return {
    record: record,
    report: buildReport(Object.assign({}, input, { includePlans: true })),
    validation: validation,
    version: hashToken(JSON.stringify({ input: input, record: record })),
    final: false,
  }
}
function handle_report_preview(payload, ctx) {
  return withLock(function () {
    return reportState(payload)
  })
}
function handle_report_validate(payload, ctx) {
  return handle_report_preview(payload, ctx)
}
function handle_report_list(payload, ctx) {
  var year = referenceNumber(payload.tahun, 'Tahun', 1900, 2200, true)
  return withLock(function () {
    var records = getSheetRecords('report_month')
    var activities = getSheetRecords('activity')
    var profile = getProfileState().profile,
      refs = activityReferences(),
      holidays = getSheetRecords('holiday')
    return Array.from({ length: 12 }, function (_, index) {
      var month = year + '-' + String(index + 1).padStart(2, '0')
      var record = records.filter(function (row) {
        return Number(row.tahun) === year && Number(row.bulan) === index + 1
      })[0]
      var count = activities.filter(function (row) {
        return row.tanggal.slice(0, 7) === month && row.status !== 'dibatalkan'
      }).length
      var ready =
        count &&
        !validateReport({
          month: month,
          records: activities,
          profile: profile,
          references: refs,
          holidays: holidays,
        }).errors.length
      return {
        month: month,
        status:
          record && record.status === 'final'
            ? 'final'
            : ready
              ? 'ready'
              : count
                ? 'draft'
                : 'kosong',
        count: count,
        pdf_url: record && record.status === 'final' ? record.pdf_url : '',
      }
    })
  })
}
function handle_report_finalize(payload, ctx) {
  return withLock(function () {
    var state = reportState(payload)
    if (state.final) {
      if (payload.version !== state.version)
        referenceError('FORBIDDEN_STATE', 'Laporan sudah final. Muat ulang laporan.')
      return { record: state.record, alreadyFinal: true }
    }
    if (payload.version !== state.version)
      referenceError(
        'CONFLICT',
        'Data berubah setelah pratinjau. Muat ulang pemeriksaan sebelum finalisasi.',
      )
    if (state.validation.errors.length)
      referenceError('VALIDATION', 'Perbaiki semua Error sebelum finalisasi.')
    if (state.validation.warnings.length && payload.confirmWarnings !== true)
      referenceError('VALIDATION', 'Konfirmasikan peringatan sebelum finalisasi.')
    var input = reportInput(payload)
    var report = buildReport(input)
    var snapshot = { report: report, validation: state.validation, sourceVersion: state.version }
    var serialized = JSON.stringify(snapshot)
    if (serialized.length > 45000)
      referenceError(
        'VALIDATION',
        'Snapshot laporan terlalu besar untuk satu sel. Ringkas deskripsi atau perkecil logo sebelum finalisasi.',
      )
    var pdf = createReportPdf(report)
    var stamp = referenceStamp()
    var record = Object.assign(
      {},
      state.record || { id: generateUuid(), created_at: stamp, deleted: 0 },
      {
        tahun: Number(payload.month.slice(0, 4)),
        bulan: Number(payload.month.slice(5)),
        status: 'final',
        tanggal_ttd: report.tanggal_ttd,
        pdf_file_id: pdf.id,
        pdf_url: pdf.url,
        snapshot_json: serialized,
        finalized_at: stamp,
        updated_at: stamp,
      },
    )
    try {
      commitReference('report_month', [record])
    } catch (error) {
      try {
        DriveApp.getFileById(pdf.id).setTrashed(true)
      } catch (cleanupError) {
        /* No permanent deletion. */
      }
      throw error
    }
    appendAudit(
      'report.finalize',
      'report_month',
      record.id,
      'Laporan difinalisasi dan PDF dibuat.',
    )
    return { record: record, alreadyFinal: false }
  })
}
function handle_report_reopen(payload, ctx) {
  return withLock(function () {
    var record = reportRecord(payload.month)
    var reason = referenceText(payload.reason, 'Alasan pembukaan kembali', true)
    if (!record || record.status !== 'final')
      referenceError('FORBIDDEN_STATE', 'Hanya laporan final yang dapat dibuka kembali.')
    referenceVersion(record, payload)
    var next = Object.assign({}, record, { status: 'draft', updated_at: referenceStamp() })
    commitReference('report_month', [next])
    appendAudit('report.reopen', 'report_month', record.id, reason)
    return { record: next }
  })
}
function handle_report_exportPdf(payload, ctx) {
  return withLock(function () {
    var record = reportRecord(payload.month)
    if (!record || record.status !== 'final')
      referenceError('FORBIDDEN_STATE', 'Finalisasi laporan sebelum ekspor PDF.')
    referenceVersion(record, payload)
    if (record.pdf_file_id) {
      try {
        var file = DriveApp.getFileById(record.pdf_file_id)
        if (!file.isTrashed()) return { record: record }
      } catch (error) {
        /* Rebuild from frozen snapshot only. */
      }
    }
    var snapshot = JSON.parse(record.snapshot_json)
    var pdf = createReportPdf(snapshot.report)
    var next = Object.assign({}, record, {
      pdf_file_id: pdf.id,
      pdf_url: pdf.url,
      updated_at: referenceStamp(),
    })
    try {
      commitReference('report_month', [next])
    } catch (error) {
      try {
        DriveApp.getFileById(pdf.id).setTrashed(true)
      } catch (cleanupError) {
        /* Recoverable orphan only. */
      }
      throw error
    }
    appendAudit(
      'report.exportPdf',
      'report_month',
      record.id,
      'PDF dibuat ulang dari snapshot final.',
    )
    return { record: next }
  })
}
function reportFolder(parent, name) {
  var folders = parent.getFoldersByName(name)
  return folders.hasNext() ? folders.next() : parent.createFolder(name)
}
function createReportPdf(report) {
  var parent = DriveApp.getFolderById(report.profile.folder_pdf_id)
  var folder = reportFolder(reportFolder(parent, 'LKB'), report.month.slice(0, 4))
  var template = HtmlService.createTemplateFromFile('report')
  template.report = report
  template.formatTableDate = formatTableDate
  template.formatSignatureDate = formatSignatureDate
  template.formatPeriod = function (month) {
    return BULAN_INDONESIA[Number(month.slice(5)) - 1] + ' Tahun ' + month.slice(0, 4)
  }
  var blob = template
    .evaluate()
    .getAs('application/pdf')
    .setName(reportFileName(report.profile.nama, report.month))
  var file = folder.createFile(blob)
  return { id: file.getId(), url: file.getUrl() }
}
