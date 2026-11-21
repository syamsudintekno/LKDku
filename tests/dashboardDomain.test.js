import { it, expect } from 'vitest'
import { buildDashboard, dashboardMilestones } from '../src/domain/dashboard'
import fixture from './fixtures/activity.json'

it('counts only realized quantities in matching units and keeps other units separate', () => {
  const input = {
    ...fixture,
    today: '2026-10-08',
    items: [{ ...fixture.items[0], target_tahunan: 4 }],
    records: [
      { ...fixture.activity, id: 'a', tanggal: '2026-09-01', status: 'terealisasi', jumlah: 2 },
      { ...fixture.activity, id: 'b', status: 'terealisasi', jumlah: 3 },
      { ...fixture.activity, id: 'c', status: 'terealisasi', satuan: 'Draft', jumlah: 9 },
      { ...fixture.activity, id: 'd', status: 'rencana', jumlah: 50 },
      { ...fixture.activity, id: 'e', status: 'terealisasi', deleted: 1, jumlah: 90 },
    ],
  }
  const data = buildDashboard(input)
  expect(data.items[0].realized).toBe(5)
  expect(data.items[0].percent).toBe(125)
  expect(data.items[0].monthly[9]).toBe(3)
  expect(data.items[0].otherUnits).toEqual([{ satuan: 'Draft', jumlah: 9, count: 1 }])
  expect(data.monthly.realized).toBe(2)
  expect(data.monthly.planned).toBe(1)
})
it('celebrates verified threshold crossings only for unchanged targets and the same month', () => {
  const before = {
    month: '2026-10',
    items: [{ id: 'a', kode: 'P-01', target_tahunan: 4, realized: 3 }],
    workdays: { total: 2, complete: 1 },
  }
  const after = {
    ...before,
    items: [{ ...before.items[0], realized: 4 }],
    workdays: { total: 2, complete: 2 },
  }
  expect(dashboardMilestones(before, after)).toEqual({ targets: ['P-01'], monthComplete: true })
  expect(dashboardMilestones(after, after)).toEqual({ targets: [], monthComplete: false })
  expect(dashboardMilestones(before, { ...after, month: '2026-11' })).toEqual({
    targets: [],
    monthComplete: false,
  })
  expect(
    dashboardMilestones(before, { ...after, items: [{ ...after.items[0], target_tahunan: 2 }] })
      .targets,
  ).toEqual([])
})
it('calculates incidental ratio by realized activity count and excludes future empty-day warnings', () => {
  const data = buildDashboard({
    ...fixture,
    today: '2026-10-02',
    records: [
      {
        ...fixture.activity,
        status: 'terealisasi',
        sumber: 'insidental',
        skp_item_id: '',
        alasan_insidental: 'Uji',
      },
    ],
  })
  expect(data.monthly.incidentalRatio).toBe(100)
  expect(data.emptyWorkdays).toEqual(['2026-10-02'])
  expect(data.zeroUnsur).toContain('Pengabdian')
  expect(
    buildDashboard({ ...fixture, today: '2026-09-01', records: [] }).monthly.incidentalRatio,
  ).toBe(0)
  expect(buildDashboard({ ...fixture, today: '2026-09-01', records: [] }).emptyWorkdays).toEqual([])
})
