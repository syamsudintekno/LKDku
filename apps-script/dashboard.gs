function handle_dashboard_summary(payload, ctx) {
  return withLock(function () {
    var refs = activityReferences()
    var summary = buildDashboard({
      month: payload.month,
      today: currentJakartaDate(),
      records: getSheetRecords('activity'),
      years: refs.years,
      items: refs.items,
      holidays: getSheetRecords('holiday'),
      config: refs.config,
    })
    summary.todayFinal = activityMonthIsFinal(summary.today.slice(0, 7))
    return summary
  })
}
