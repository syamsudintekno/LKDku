function handle_plan_generate(payload, ctx) {
  return withLock(function () {
    assertEditableActivityMonth(payload.month)
    if (payload.dryRun !== undefined && typeof payload.dryRun !== 'boolean')
      referenceError('VALIDATION', 'Pilihan pratinjau generator tidak valid.')
    var refs = activityReferences()
    var plan = generateDraftPlan(
      Object.assign({}, refs, {
        month: payload.month,
        holidays: getSheetRecords('holiday'),
        activities: getSheetRecords('activity', true),
      }),
    )
    var version = hashToken(JSON.stringify(plan))
    if (payload.dryRun !== false)
      return Object.assign({}, plan, {
        previewVersion: version,
        dryRun: true,
        created: 0,
        records: [],
      })
    if (plan.candidates.length && payload.previewVersion !== version)
      referenceError(
        'CONFLICT',
        'Jadwal atau kegiatan berubah setelah pratinjau. Periksa pratinjau terbaru sebelum menyimpan.',
      )
    var records = []
    if (plan.candidates.length) {
      var stamp = referenceStamp()
      records = plan.candidates.map(function (row) {
        return Object.assign({}, row, {
          id: generateUuid(),
          created_at: stamp,
          updated_at: stamp,
          deleted: 0,
        })
      })
      commitReference('activity', records)
      appendAudit(
        'plan.generate',
        'activity',
        payload.month,
        records.length + ' kegiatan rencana ditambahkan.',
      )
    }
    return {
      created: records.length,
      skipped: plan.skipped,
      records: records,
      warnings: plan.warnings,
      previewVersion: version,
      dryRun: false,
    }
  })
}
