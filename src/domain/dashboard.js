import { buildActivityDays, monthDates } from './activityDays'
import { isIsoDate } from './templateSchedule'
import { activityError, numberActivities } from './activity'
export function dashboardMilestones(before, after) {
  if (!before || !after || before.month !== after.month)
    return { targets: [], monthComplete: false }
  return {
    targets: after.items
      .filter((item) => {
        const previous = before.items.find((row) => row.id === item.id)
        const target = Number(item.target_tahunan)
        return (
          previous &&
          target > 0 &&
          Number(previous.target_tahunan) === target &&
          previous.realized < target &&
          item.realized >= target
        )
      })
      .map((item) => item.kode),
    monthComplete:
      after.workdays.total > 0 &&
      before.workdays.total === after.workdays.total &&
      before.workdays.complete < before.workdays.total &&
      after.workdays.complete === after.workdays.total,
  }
}

export function buildDashboard({ month, today, records, years, items, holidays = [], config }) {
  monthDates(month)
  if (!isIsoDate(today)) activityError('Tanggal ringkasan tidak valid.')
  const year = Number(month.slice(0, 4))
  const active = records.filter((row) => row.deleted != 1 && row.status !== 'dibatalkan')
  const realized = active.filter((row) => row.status === 'terealisasi')
  const monthly = active.filter((row) => row.tanggal.slice(0, 7) === month)
  const done = monthly.filter((row) => row.status === 'terealisasi')
  const incidental = done.filter((row) => row.sumber === 'insidental')
  const days = buildActivityDays(month, monthly, holidays)
  const workdays = days.filter(
    (day) =>
      ![0, 6].includes(day.weekday) &&
      !holidays.some((row) => row.deleted != 1 && row.tanggal === day.tanggal),
  )
  const parents = new Set(
    years.filter((row) => row.deleted != 1 && Number(row.tahun) === year).map((row) => row.id),
  )
  return {
    month,
    today,
    monthly: {
      realized: done.length,
      planned: monthly.filter((row) => row.status === 'rencana').length,
      incidental: incidental.length,
      incidentalRatio: done.length ? (100 * incidental.length) / done.length : 0,
    },
    workdays: {
      total: workdays.length,
      filled: workdays.filter((day) => day.total > 0).length,
      complete: workdays.filter((day) => day.complete).length,
    },
    emptyWorkdays: workdays
      .filter((day) => day.kind === 'empty' && day.tanggal <= today)
      .map((day) => day.tanggal),
    unsur: (config.unsur_list || []).map((unsur) => ({
      unsur,
      count: done.filter((row) => row.unsur === unsur).length,
    })),
    zeroUnsur: (config.unsur_list || []).filter(
      (unsur) => !done.some((row) => row.unsur === unsur),
    ),
    incidental: numberActivities(monthly.filter((row) => row.sumber === 'insidental')),
    todayRecords: numberActivities(active.filter((row) => row.tanggal === today)),
    items: items
      .filter((item) => item.deleted != 1 && parents.has(item.skp_year_id))
      .map((item) => {
        const related = realized.filter(
          (row) => row.skp_item_id === item.id && Number(row.tanggal.slice(0, 4)) === year,
        )
        const matched = related.filter((row) => row.satuan === item.satuan_target)
        const sum = (rows) => rows.reduce((value, row) => value + Number(row.jumlah), 0)
        const total = sum(matched),
          target = Number(item.target_tahunan) || 0
        const otherUnits = [
          ...new Set(
            related.filter((row) => row.satuan !== item.satuan_target).map((row) => row.satuan),
          ),
        ].map((satuan) => {
          const rows = related.filter((row) => row.satuan === satuan)
          return { satuan, jumlah: sum(rows), count: rows.length }
        })
        return {
          ...item,
          realized: total,
          percent: target > 0 ? (100 * total) / target : 0,
          monthly: Array.from({ length: 12 }, (_, index) =>
            sum(matched.filter((row) => Number(row.tanggal.slice(5, 7)) === index + 1)),
          ),
          otherUnits,
        }
      }),
  }
}
