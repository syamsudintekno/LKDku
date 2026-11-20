// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  validateActivity,
  findTimeConflicts,
  numberActivities,
  realizedActivities,
  activityDescription,
} from '../src/domain/activity'
import { buildActivityDays, plannedActivitiesForScope } from '../src/domain/activityDays'
import { generateDraftPlan } from '../src/domain/plan'
import fixture from './fixtures/activity.json'

const refs = fixture
const plan = (changes = {}) =>
  generateDraftPlan({ ...fixture, holidays: [], activities: [], ...changes })
describe('Generator M2', () => {
  it('membuat empat Kamis × dua kegiatan rencana tanpa mengubah input', () => {
    const snapshot = JSON.stringify(fixture)
    const result = plan()
    expect(result.candidates).toHaveLength(8)
    expect(new Set(result.candidates.map((row) => row.generated_key)).size).toBe(8)
    expect(result.candidates.every((row) => row.status === 'rencana')).toBe(true)
    expect(result.candidates[0].generated_key).toBe('template-a|2026-10-01|1')
    expect(JSON.stringify(fixture)).toBe(snapshot)
  })
  it('idempoten termasuk kunci kegiatan yang dipindah, diedit, dibatalkan, dan soft delete', () => {
    const old = plan().candidates.map((row, index) => ({
      ...row,
      id: `test-${index}`,
      tanggal: '2026-11-01',
      deskripsi: 'Telah disunting',
      status: index % 2 ? 'dibatalkan' : 'terealisasi',
      deleted: index % 2,
    }))
    const result = plan({ activities: old })
    expect(result.candidates).toHaveLength(0)
    expect(result.skipped).toBe(8)
  })
  it('melewati libur dan pengecualian tanpa menggeser jadwal', () => {
    const result = plan({
      holidays: [{ tanggal: '2026-10-08' }],
      templates: fixture.templates.map((row) => ({ ...row, pengecualian: ['2026-10-22'] })),
    })
    expect(result.candidates.map((row) => row.tanggal)).toEqual([
      '2026-10-01',
      '2026-10-01',
      '2026-10-15',
      '2026-10-15',
    ])
  })
  it('hanya memakai SKP aktif dan butir/template yang tidak dihapus atau dinonaktifkan', () => {
    expect(plan({ years: [{ ...fixture.years[0], status: 'draft' }] }).candidates).toHaveLength(0)
    expect(plan({ items: [{ ...fixture.items[0], aktif: 0 }] }).candidates).toHaveLength(0)
    expect(
      plan({ templates: fixture.templates.map((row) => ({ ...row, deleted: 1 })) }).candidates,
    ).toHaveLength(0)
  })
  it('menyertakan Sabtu yang dipilih dan melewati pengecualian 31 Oktober', () => {
    const template = {
      ...fixture.templates[0],
      hari: 6,
      frekuensi: '2-mingguan',
      tgl_mulai: '2026-09-05',
      tgl_akhir: '2026-10-31',
      pengecualian: ['2026-10-31'],
    }
    expect(plan({ templates: [template] }).candidates.map((row) => row.tanggal)).toEqual([
      '2026-10-03',
      '2026-10-17',
    ])
  })
})
describe('Validasi dan bentrok kegiatan', () => {
  it('tidak mengubah rencana menjadi terealisasi tanpa pilihan eksplisit', () => {
    const draft = { ...fixture.activity }
    delete draft.status
    expect(validateActivity(draft, refs).status).toBe('rencana')
    expect(validateActivity({ ...draft, status: 'terealisasi' }, refs).status).toBe('terealisasi')
  })
  it('insidental wajib beralasan dan tidak memiliki tautan SKP/template', () => {
    const draft = { ...fixture.activity, sumber: 'insidental', skp_item_id: '', template_id: '' }
    expect(() => validateActivity(draft, refs)).toThrow(/alasan/i)
    expect(
      validateActivity({ ...draft, alasan_insidental: 'Undangan kegiatan uji' }, refs).sumber,
    ).toBe('insidental')
    expect(() =>
      validateActivity({ ...draft, skp_item_id: 'item-test', alasan_insidental: 'Uji' }, refs),
    ).toThrow()
  })
  it('menolak tanggal/jam/jumlah/sumber/unsur/satuan dan tautan yang tidak valid', () => {
    for (const patch of [
      { tanggal: '2026-02-30' },
      { tanggal: '2027-01-01' },
      { jam_selesai: '' },
      { jam_mulai: '09:30' },
      { jumlah: 0 },
      { jumlah: [1] },
      { unsur: 'Lainnya' },
      { satuan: 'Tidak ada' },
      { skp_item_id: '' },
      { template_id: 'tidak-ada' },
      { status: 'selesai' },
      { sumber: 'lain' },
      { bukti_url: 'javascript:alert(1)' },
    ])
      expect(() => validateActivity({ ...fixture.activity, ...patch }, refs)).toThrow()
  })
  it('menjaga tautan kegiatan hasil generator walaupun template/butir lama dihapus', () => {
    const old = {
      ...fixture.activity,
      template_id: 'template-a',
      generated_key: 'template-a|2026-10-01|1',
    }
    const previousRefs = {
      ...refs,
      items: refs.items.map((row) => ({ ...row, deleted: 1, aktif: 0 })),
      templates: refs.templates.map((row) => ({ ...row, deleted: 1 })),
    }
    expect(
      validateActivity({ ...old, deskripsi: 'Disunting' }, previousRefs, old).skp_item_id,
    ).toBe('item-test')
    expect(() =>
      validateActivity(
        {
          ...old,
          sumber: 'insidental',
          skp_item_id: '',
          template_id: '',
          alasan_insidental: 'Uji',
        },
        refs,
        old,
      ),
    ).toThrow()
  })
  it('bentrok memakai interval setengah terbuka dan mengabaikan diri sendiri/dibatalkan/dihapus', () => {
    const candidate = { ...fixture.activity, id: 'a' }
    const rows = [
      candidate,
      { ...candidate, id: 'b', jam_mulai: '09:30', jam_selesai: '10:00' },
      { ...candidate, id: 'c', jam_mulai: '08:00', jam_selesai: '10:00' },
      { ...candidate, id: 'd', deleted: 1 },
      { ...candidate, id: 'e', status: 'dibatalkan' },
    ]
    expect(findTimeConflicts(candidate, rows).map((row) => row.id)).toEqual(['c'])
    expect(findTimeConflicts({ ...candidate, jam_mulai: '', jam_selesai: '' }, rows)).toEqual([])
    expect(validateActivity(candidate, refs).jam_mulai).toBe('07:00')
  })
})
describe('Susunan hari dan nomor', () => {
  it('urut jam lalu pencatatan; nomor dimulai lagi pada setiap tanggal', () => {
    const rows = [
      { ...fixture.activity, id: 'b', created_at: '2026-10-01T02:00:00Z' },
      { ...fixture.activity, id: 'a', created_at: '2026-10-01T01:00:00Z' },
      { ...fixture.activity, id: 'c', tanggal: '2026-10-02' },
      { ...fixture.activity, id: 'late', jam_mulai: '', jam_selesai: '' },
    ]
    expect(numberActivities(rows).map((row) => [row.id, row.nomor])).toEqual([
      ['a', 1],
      ['b', 2],
      ['late', 3],
      ['c', 1],
    ])
  })
  it('hanya selector terealisasi memuat kegiatan untuk laporan final', () => {
    const rows = ['rencana', 'terealisasi', 'dibatalkan'].map((status, index) => ({
      ...fixture.activity,
      id: String(index),
      status,
    }))
    rows.push({ ...fixture.activity, status: 'terealisasi', deleted: 1 })
    expect(realizedActivities(rows).map((row) => row.status)).toEqual(['terealisasi'])
    expect(activityDescription(fixture.activity)).toContain('pukul 07.00–09.30')
  })
  it('membedakan libur kosong, Sabtu berkegiatan, dan hari kerja kosong pada Oktober', () => {
    const rows = ['2026-10-03', '2026-10-17'].map((tanggal) => ({ ...fixture.activity, tanggal }))
    const days = buildActivityDays('2026-10', rows, [])
    expect(days).toHaveLength(31)
    expect(days.filter((day) => day.kind === 'holiday').map((day) => day.tanggal)).toEqual([
      '2026-10-04',
      '2026-10-10',
      '2026-10-11',
      '2026-10-18',
      '2026-10-24',
      '2026-10-25',
      '2026-10-31',
    ])
    expect(days[0].kind).toBe('empty')
    expect(days[0].warnings).toContain('Hari kerja kosong')
    expect(days[2].kind).toBe('activity')
  })
})

it('aksi pekan membatasi bulan tampilan dan hanya mengambil rencana yang sudah tersimpan', () => {
  const rows = ['2026-10-31', '2026-11-01', '2026-11-02'].map((tanggal, index) => ({
    ...fixture.activity,
    tanggal,
    id: String(index),
  }))
  rows.push(
    { ...rows[1], id: 'pending', optimistic: true },
    { ...rows[1], id: 'done', status: 'terealisasi' },
  )
  expect(plannedActivitiesForScope(rows, '2026-11-01', 'week').map((row) => row.id)).toEqual(['1'])
  expect(() => plannedActivitiesForScope(rows, '2026-02-30', 'week')).toThrow()
})
it('kalender tidak menandai capaian lengkap dari data yang masih menunggu server', () => {
  expect(
    buildActivityDays(
      '2026-10',
      [{ ...fixture.activity, status: 'terealisasi', optimistic: true }],
      [],
    )[0].complete,
  ).toBe(false)
})
