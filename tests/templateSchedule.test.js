// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import {
  isIsoDate,
  previewTemplateDates,
  validateTemplateSchedule,
} from '../src/domain/templateSchedule'
import fixture from './fixtures/templateSchedule.json'

const context = createContext({})
runInContext(readFileSync(new URL('../apps-script/schedule.gs', import.meta.url), 'utf8'), context)
for (const [name, preview] of [
  ['frontend', previewTemplateDates],
  ['Apps Script', context.previewTemplateDates],
]) {
  describe(`Pratinjau jadwal ${name}`, () => {
    it('membentuk empat Kamis pada rentang uji yang sama', () => {
      expect(Array.from(preview(fixture.thursday, '2026-10'))).toEqual(fixture.thursdayDates)
    })
    it('melewati libur dan pengecualian tanpa mengubah tanggal ISO', () => {
      expect(
        Array.from(
          preview({ ...fixture.thursday, pengecualian: ['2026-10-08'] }, '2026-10', [
            { tanggal: '2026-10-15' },
          ]),
        ),
      ).toEqual(['2026-10-01', '2026-10-22'])
    })
    it('menyertakan Sabtu eksplisit dan melewati pengecualian 31 Oktober', () => {
      expect(Array.from(preview(fixture.saturday, '2026-10'))).toEqual(fixture.saturdayDates)
    })
    it('mengikuti nomor tanggal bulanan dan tidak menggeser bulan tanpa tanggal tersebut', () => {
      const template = {
        ...fixture.thursday,
        tgl_mulai: '2026-01-31',
        tgl_akhir: '2026-12-31',
        hari: 6,
        frekuensi: 'bulanan',
      }
      expect(Array.from(preview(template, '2026-02'))).toEqual([])
      expect(Array.from(preview(template, '2026-03'))).toEqual(['2026-03-31'])
    })
    it('jadwal sekali hanya memuat tanggal mulai dan tidak menembus hari Minggu', () => {
      expect(Array.from(preview({ ...fixture.thursday, frekuensi: 'sekali' }, '2026-10'))).toEqual([
        '2026-10-01',
      ])
      expect(
        Array.from(
          preview(
            { ...fixture.thursday, tgl_mulai: '2026-10-04', hari: 7, frekuensi: 'sekali' },
            '2026-10',
          ),
        ),
      ).toEqual([])
    })
  })
}
it('menolak tanggal kalender, rentang, dan jam yang tidak valid', () => {
  expect(isIsoDate('2026-02-29')).toBe(false)
  expect(isIsoDate('2028-02-29')).toBe(true)
  for (const change of [
    { tgl_mulai: '2026-02-30' },
    { tgl_akhir: '2026-01-01' },
    { jam_mulai: '24:00' },
    { jam_selesai: '' },
    { pengecualian: ['2027-01-01'] },
    { hari: 0 },
    { hari: [4] },
    { frekuensi: 'harian' },
  ])
    expect(() => validateTemplateSchedule({ ...fixture.thursday, ...change })).toThrow()
})
it('menjaga port Apps Script identik dengan domain frontend', () => {
  const source = readFileSync(new URL('../src/domain/templateSchedule.js', import.meta.url), 'utf8')
  const port = readFileSync(new URL('../apps-script/schedule.gs', import.meta.url), 'utf8')
  expect(port).toBe(
    '// Generated from src/domain/templateSchedule.js. Run node scripts/sync-domain.mjs.\n' +
      source.replaceAll('export function ', 'function '),
  )
})
