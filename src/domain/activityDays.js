import { isIsoDate } from './templateSchedule'
import { activityError, numberActivities, findTimeConflicts } from './activity'

export function monthDates(month) {
  if (
    typeof month !== 'string' ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    Number(month.slice(0, 4)) < 1900 ||
    Number(month.slice(0, 4)) > 2200
  )
    activityError('Pilih bulan antara tahun 1900 dan 2200.')
  const dates = []
  for (
    let day = new Date(`${month}-01T00:00:00Z`);
    day.toISOString().slice(0, 7) === month;
    day = new Date(day.getTime() + 86400000)
  )
    dates.push(day.toISOString().slice(0, 10))
  return dates
}

export function buildActivityDays(month, rows, holidays = []) {
  const activities = numberActivities(rows)
  const holidayDates = new Set(
    holidays
      .filter((row) => typeof row === 'string' || row.deleted != 1)
      .map((row) => (typeof row === 'string' ? row : row.tanggal)),
  )
  return monthDates(month).map((tanggal) => {
    const records = activities.filter((row) => row.tanggal === tanggal)
    const active = records.filter((row) => row.status !== 'dibatalkan')
    const weekday = new Date(`${tanggal}T00:00:00Z`).getUTCDay()
    const holiday = weekday === 0 || weekday === 6 || holidayDates.has(tanggal)
    const kind = active.length ? 'activity' : holiday ? 'holiday' : 'empty'
    const overlapping = active.some((row) => findTimeConflicts(row, active).length)
    return {
      tanggal,
      weekday,
      kind,
      records,
      total: active.length,
      realized: active.filter((row) => row.status === 'terealisasi').length,
      planned: active.filter((row) => row.status === 'rencana').length,
      incidental: active.filter((row) => row.sumber === 'insidental').length,
      complete:
        active.length > 0 && active.every((row) => row.status === 'terealisasi' && !row.optimistic),
      warnings: [
        ...(kind === 'empty' ? ['Hari kerja kosong'] : []),
        ...(overlapping ? ['Bentrok jam'] : []),
      ],
    }
  })
}

export function plannedActivitiesForScope(rows, date, scope = 'day') {
  const day = new Date(`${date}T00:00:00Z`)
  if (!isIsoDate(date) || Number.isNaN(day.getTime()) || !['day', 'week'].includes(scope))
    activityError('Tanggal atau cakupan kegiatan tidak valid.')
  const start =
    scope === 'day' ? day : new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * 86400000)
  const end = new Date(start.getTime() + (scope === 'day' ? 1 : 7) * 86400000)
  return rows.filter(
    (row) =>
      row.deleted != 1 &&
      !row.optimistic &&
      row.status === 'rencana' &&
      row.tanggal.slice(0, 7) === date.slice(0, 7) &&
      row.tanggal >= start.toISOString().slice(0, 10) &&
      row.tanggal < end.toISOString().slice(0, 10),
  )
}
