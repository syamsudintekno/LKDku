import { previewTemplateDates } from './templateSchedule'
import { validateActivity, findTimeConflicts } from './activity'
import { monthDates } from './activityDays'

export function generateDraftPlan({
  month,
  years,
  items,
  templates,
  holidays = [],
  activities = [],
  config,
}) {
  monthDates(month)
  const activeYears = new Set(
    years
      .filter(
        (row) =>
          row.deleted != 1 &&
          row.status === 'aktif' &&
          Number(row.tahun) === Number(month.slice(0, 4)),
      )
      .map((row) => row.id),
  )
  const activeItems = items.filter(
    (row) => row.deleted != 1 && Number(row.aktif) === 1 && activeYears.has(row.skp_year_id),
  )
  const activeTemplates = templates
    .filter((row) => row.deleted != 1 && activeItems.some((item) => item.id === row.skp_item_id))
    .sort((a, b) => Number(a.urutan) - Number(b.urutan) || a.id.localeCompare(b.id))
  const seen = new Set(
    activities.filter((row) => row.generated_key).map((row) => row.generated_key),
  )
  const candidates = []
  let skipped = 0
  for (const template of activeTemplates) {
    if (!Number.isInteger(Number(template.urutan)) || Number(template.urutan) < 1)
      throw Object.assign(new Error('Urutan template tidak valid.'), { code: 'VALIDATION' })
    const item = activeItems.find((row) => row.id === template.skp_item_id)
    for (const tanggal of previewTemplateDates(
      template,
      month,
      holidays.filter((row) => row.deleted != 1),
    )) {
      const key = `${template.id}|${tanggal}|${Number(template.urutan)}`
      if (seen.has(key)) {
        skipped++
        continue
      }
      const fields = validateActivity(
        {
          ...template,
          tanggal,
          unsur: item.unsur,
          template_id: template.id,
          sumber: 'skp',
          status: 'rencana',
          alasan_insidental: '',
        },
        { years, items, templates, config },
      )
      candidates.push({ ...fields, generated_key: key })
      seen.add(key)
    }
  }
  candidates.sort(
    (a, b) =>
      a.tanggal.localeCompare(b.tanggal) ||
      (a.jam_mulai || '24:00').localeCompare(b.jam_mulai || '24:00'),
  )
  const all = [...activities, ...candidates]
  const warnings = candidates
    .filter((row) => findTimeConflicts(row, all).length)
    .map((row) => ({
      generated_key: row.generated_key,
      message: 'Bentrok jam pada ' + row.tanggal,
    }))
  return { candidates, skipped, activeTemplates: activeTemplates.length, warnings }
}
