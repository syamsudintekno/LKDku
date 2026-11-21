// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createServer } from './fixtures/appsScriptServer.mjs'

const fixture = () => {
  const server = createServer()
  const token = server.login().data.token
  const call = (action, payload = {}) => server.request(action, payload, token)
  const year = call('skp.year.upsert', {
    tahun: 2026,
    status: 'draft',
    catatan: 'Rencana uji',
  }).data
  const itemDraft = {
    skp_year_id: year.id,
    kode: 'P-TEST',
    unsur: 'Pendidikan',
    rencana_hasil_kerja: 'Pengajaran uji',
    indikator: 'Kelas uji selesai',
    target_tahunan: 8,
    satuan_target: 'Kelas',
    aktif: 1,
  }
  const item = call('skp.item.upsert', itemDraft).data
  const templateDraft = {
    skp_item_id: item.id,
    deskripsi: 'Kelas palsu untuk pengujian',
    hari: 4,
    frekuensi: 'mingguan',
    tgl_mulai: '2026-10-01',
    tgl_akhir: '2026-10-28',
    jam_mulai: '07:00',
    jam_selesai: '09:30',
    jumlah: 1,
    satuan: 'Kelas',
    pengecualian: [],
    urutan: 1,
  }
  return { ...server, call, year, itemDraft, item, templateDraft }
}
describe('Server M1', () => {
  it('memuat referensi dalam bootstrap terautentikasi', () => {
    const { call, year, item } = fixture()
    const data = call('bootstrap', { tahun: 2026 }).data
    expect(data.years[0].id).toBe(year.id)
    expect(data.items[0].id).toBe(item.id)
    expect(data.holidays).toEqual([])
    expect(data.profileVersion).toBeTruthy()
  })
  it('menyimpan profil sebagian, mempertahankan NIP sebagai teks, dan menolak versi usang', () => {
    const { call } = fixture()
    const profile = call('profile.get').data
    const result = call('profile.update', {
      version: profile.version,
      profile: { nama: 'Dosen Uji', nip: '000000000000000001', kop_1: 'KOP UJI' },
    })
    expect(result.ok).toBe(true)
    expect(result.data.profile.nip).toBe('000000000000000001')
    expect(
      call('profile.update', { version: profile.version, profile: { nama: 'Timpa' } }).error.code,
    ).toBe('CONFLICT')
    expect(call('profile.get').data.profile.nama).toBe('Dosen Uji')
    expect(
      call('profile.update', { version: result.data.version, profile: { nip: '123' } }).error.code,
    ).toBe('VALIDATION')
    expect(
      call('profile.update', {
        version: result.data.version,
        profile: { nama: '=IMPORTXML("url")' },
      }).error.code,
    ).toBe('VALIDATION')
  })
  it('hanya mengizinkan satu SKP aktif per tahun dan mengunci arsip', () => {
    const { call, year, itemDraft } = fixture()
    const active = call('skp.year.upsert', { ...year, status: 'aktif' }).data
    const other = call('skp.year.upsert', { tahun: 2026, status: 'draft' }).data
    expect(call('skp.year.upsert', { ...other, status: 'aktif' }).error.code).toBe('VALIDATION')
    const archived = call('skp.year.upsert', { ...active, status: 'arsip' }).data
    expect(archived.status).toBe('arsip')
    expect(call('skp.item.upsert', itemDraft).error.code).toBe('FORBIDDEN_STATE')
    expect(call('skp.year.upsert', { ...archived, status: 'aktif' }).error.code).toBe(
      'FORBIDDEN_STATE',
    )
  })
  it('memvalidasi target, unsur, satuan, kode unik, dan parent butir', () => {
    const { call, itemDraft, item } = fixture()
    for (const change of [
      { target_tahunan: 0 },
      { target_tahunan: 'x' },
      { target_tahunan: [8] },
      { target_tahunan: true },
      { unsur: 'Lainnya' },
      { satuan_target: 'Tidak ada' },
      { skp_year_id: 'tidak-ada' },
    ])
      expect(call('skp.item.upsert', { ...itemDraft, kode: 'R-TEST', ...change }).ok).toBe(false)
    expect(call('skp.item.upsert', itemDraft).error.code).toBe('VALIDATION')
    const changed = call('skp.item.upsert', { ...item, kode: 'P-CHANGED' })
    expect(changed.ok).toBe(true)
    expect(call('skp.item.upsert', { ...item, kode: 'P-OLD' }).error.code).toBe('CONFLICT')
  })
  it('menolak template tanpa butir atau di luar tahun SKP dan mempratinjau sebelum menyimpan', () => {
    const { call, templateDraft, context } = fixture()
    expect(call('skp.template.upsert', { ...templateDraft, skp_item_id: '' }).ok).toBe(false)
    expect(
      call('skp.template.upsert', { ...templateDraft, tgl_akhir: '2027-01-01' }).error.code,
    ).toBe('VALIDATION')
    expect(call('skp.template.preview', { ...templateDraft, month: '2026-10' }).data.dates).toEqual(
      ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22'],
    )
    expect(context.getSheetRecords('skp_template')).toHaveLength(0)
    expect(call('skp.template.upsert', templateDraft).ok).toBe(true)
  })
  it('menghapus butir dan template secara soft delete lalu memulihkannya tanpa mengubah activity', () => {
    const { call, context, item, templateDraft } = fixture()
    const template = call('skp.template.upsert', templateDraft).data
    context.withLock(() =>
      context.appendSheetRecord('activity', {
        skp_item_id: item.id,
        template_id: template.id,
        deskripsi: 'Kegiatan palsu tersimpan',
        status: 'rencana',
      }),
    )
    const deleted = call('skp.item.delete', item).data
    expect(context.getSheetRecords('skp_item')).toHaveLength(0)
    expect(context.getSheetRecords('skp_template')).toHaveLength(0)
    expect(context.getSheetRecords('activity')).toHaveLength(1)
    expect(call('skp.item.restore', deleted.record).ok).toBe(true)
    expect(context.getSheetRecords('skp_template')).toHaveLength(1)
    expect(context.getSheetRecords('activity')[0].status).toBe('rencana')
  })
  it('tidak memulihkan template yang dihapus sebelum butirnya', () => {
    const { call, context, item, templateDraft } = fixture()
    const template = call('skp.template.upsert', templateDraft).data
    call('skp.template.delete', template)
    const deleted = call('skp.item.delete', item).data
    call('skp.item.restore', deleted.record)
    expect(context.getSheetRecords('skp_template')).toHaveLength(0)
  })
  it('impor libur memvalidasi semua baris sebelum menulis dan idempoten per tanggal', () => {
    const { call, context } = fixture()
    const row = { tanggal: '2026-10-08', keterangan: 'Libur kampus palsu', jenis: 'kampus' }
    expect(
      call('holiday.import', { tahun: 2026, rows: [row, { ...row, tanggal: '2026-02-30' }] }).ok,
    ).toBe(false)
    expect(context.getSheetRecords('holiday')).toHaveLength(0)
    expect(call('holiday.import', { tahun: 2026, rows: [row, row] }).data).toMatchObject({
      added: 1,
      skipped: 1,
    })
    expect(call('holiday.import', { tahun: 2026, rows: [row] }).data).toMatchObject({
      added: 0,
      skipped: 1,
    })
    expect(
      call('holiday.import', { tahun: 2026, rows: [{ ...row, tanggal: '2027-01-01' }] }).ok,
    ).toBe(false)
  })
  it('libur tersimpan mengurangi hasil pratinjau dan dapat dipulihkan setelah dihapus', () => {
    const { call, templateDraft } = fixture()
    const holiday = call('holiday.upsert', {
      tanggal: '2026-10-08',
      keterangan: 'Libur palsu',
      jenis: 'kampus',
    }).data
    expect(
      call('skp.template.preview', { ...templateDraft, month: '2026-10' }).data.dates,
    ).not.toContain('2026-10-08')
    const deleted = call('holiday.delete', holiday).data.record
    expect(call('holiday.list', { tahun: 2026 }).data).toHaveLength(0)
    expect(call('holiday.restore', deleted).ok).toBe(true)
    expect(call('holiday.list', { tahun: 2026 }).data).toHaveLength(1)
  })
  it('semua action M1 menolak token kosong dan mencatat audit perubahan', () => {
    const { request, context } = fixture()
    for (const action of [
      'profile.get',
      'profile.update',
      'skp.year.upsert',
      'skp.item.upsert',
      'skp.template.preview',
      'holiday.import',
      'holiday.restore',
    ])
      expect(request(action, {}).error.code).toBe('UNAUTHENTICATED')
    expect(context.getSheetRecords('audit_log').map((row) => row.aksi)).toContain('skp.item.upsert')
  })
})
