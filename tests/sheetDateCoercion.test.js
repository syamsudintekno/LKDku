// @vitest-environment node
import { it, expect } from 'vitest'
import { createServer } from './fixtures/appsScriptServer.mjs'

it('normalizes Google date cells before list/edit/dashboard/backup and writes dates as text', () => {
  const s = createServer(),
    token = s.login().data.token
  const call = (action, payload = {}) => s.request(action, payload, token)
  const created = call('activity.upsert', {
    tanggal: '2026-11-21',
    deskripsi: 'Fake date coercion regression',
    unsur: 'Penunjang',
    jumlah: 1,
    satuan: 'Kegiatan',
    sumber: 'insidental',
    alasan_insidental: 'Fixture only',
    status: 'rencana',
    jam_mulai: '07:00',
    jam_selesai: '08:00',
  })
  expect(created.ok).toBe(true)
  const sheet = s.sheets.get('activity')
  expect(sheet.numberFormats.some(({ col, format }) => col === 5 && format === '@')).toBe(true)
  expect(sheet.numberFormats.some(({ col, format }) => col === 10 && format === '@')).toBe(true)
  // Google getValues returns Date instances for automatically formatted date/time cells.
  s.context.withLock(() => {
    sheet.getRange(2, 5, 1, 1).setValues([[new Date('2026-11-20T17:00:00Z')]])
    sheet
      .getRange(2, 10, 1, 2)
      .setValues([[new Date('2026-11-21T00:00:00Z'), new Date('2026-11-21T01:00:00Z')]])
    sheet.getRange(2, 2, 1, 1).setValues([[new Date('2026-11-20T23:00:00Z')]])
  })
  const list = call('activity.list', { month: '2026-11' })
  expect(list.ok).toBe(true)
  const row = list.data.records[0]
  expect(row).toMatchObject({
    tanggal: '2026-11-21',
    jam_mulai: '07:00',
    jam_selesai: '08:00',
    created_at: '2026-11-20T23:00:00.000Z',
  })
  expect(call('dashboard.summary', { month: '2026-11' }).ok).toBe(true)
  expect(call('backup.export').data.document.tables.activity[0].tanggal).toBe('2026-11-21')
  const updated = call('activity.upsert', { ...row, status: 'terealisasi' })
  expect(updated.ok).toBe(true)
  expect(sheet.getRange(2, 5, 1, 1).getValues()[0][0]).toBe('2026-11-21')
  expect(sheet.getRange(2, 10, 1, 1).getValues()[0][0]).toBe('07:00')
})
