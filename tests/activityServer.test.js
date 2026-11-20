// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createServer } from './fixtures/appsScriptServer.mjs'
import fixture from './fixtures/activity.json'

const setup = () => {
  const server = createServer()
  const token = server.login().data.token
  const call = (action, payload = {}) => server.request(action, payload, token)
  server.context.withLock(() => {
    for (const [sheet, rows] of [
      ['skp_year', fixture.years],
      ['skp_item', fixture.items],
      ['skp_template', fixture.templates],
    ])
      for (const row of rows) server.context.appendSheetRecord(sheet, { ...row })
  })
  const generate = () => {
    const preview = call('plan.generate', { month: '2026-10', dryRun: true })
    return call('plan.generate', {
      month: '2026-10',
      dryRun: false,
      previewVersion: preview.data.previewVersion,
    })
  }
  return { ...server, call, generate }
}
describe('API M2', () => {
  it('dry run tidak menulis; generate dua kali tidak menggandakan kegiatan', () => {
    const { call, context, generate } = setup()
    const preview = call('plan.generate', { month: '2026-10', dryRun: true })
    expect(preview.data.candidates).toHaveLength(8)
    expect(context.getSheetRecords('activity')).toHaveLength(0)
    expect(generate().data.created).toBe(8)
    expect(
      call('plan.generate', {
        month: '2026-10',
        dryRun: false,
        previewVersion: preview.data.previewVersion,
      }).data.created,
    ).toBe(0)
    expect(generate().data.created).toBe(0)
    expect(context.getSheetRecords('activity')).toHaveLength(8)
    expect(context.getSheetRecords('activity').every((row) => row.status === 'rencana')).toBe(true)
  })
  it('menolak pratinjau basi bila jadwal/libur berubah sebelum simpan', () => {
    const { call, context } = setup()
    const preview = call('plan.generate', { month: '2026-10', dryRun: true }).data
    context.withLock(() =>
      context.appendSheetRecord('holiday', {
        tanggal: '2026-10-08',
        jenis: 'kampus',
        keterangan: 'Libur palsu',
      }),
    )
    expect(
      call('plan.generate', {
        month: '2026-10',
        dryRun: false,
        previewVersion: preview.previewVersion,
      }).error.code,
    ).toBe('CONFLICT')
    expect(context.getSheetRecords('activity')).toHaveLength(0)
  })
  it('mengedit, memindahkan, membatalkan, dan menghapus hasil generator tetap mempertahankan kuncinya', () => {
    const { call, context, generate } = setup()
    generate()
    let row = context.getSheetRecords('activity')[0]
    const key = row.generated_key
    row = call('activity.upsert', {
      ...row,
      tanggal: '2026-11-01',
      deskripsi: 'Disunting untuk uji',
      status: 'dibatalkan',
    }).data.record
    expect(row.generated_key).toBe(key)
    expect(call('activity.delete', row).ok).toBe(true)
    expect(generate().data.created).toBe(0)
    expect(context.getSheetRecords('activity', true)).toHaveLength(8)
  })
  it('validasi insidental di server dan bentrok hanya menjadi peringatan', () => {
    const { call } = setup()
    const draft = { ...fixture.activity, sumber: 'insidental', skp_item_id: '', template_id: '' }
    expect(call('activity.upsert', draft).error.code).toBe('VALIDATION')
    const first = call('activity.upsert', { ...draft, alasan_insidental: 'Undangan palsu' })
    expect(first.ok).toBe(true)
    const second = call('activity.upsert', {
      ...fixture.activity,
      jam_mulai: '08:00',
      jam_selesai: '10:00',
    })
    expect(second.ok).toBe(true)
    expect(second.data.conflicts).toHaveLength(1)
    expect(second.data.record.status).toBe('rencana')
  })
  it('menolak versi usang dan retry create dengan ID yang sama tidak menggandakan', () => {
    const { call, context } = setup()
    const payload = {
      ...fixture.activity,
      id: '11111111-1111-4111-8111-111111111111',
      create: true,
    }
    const row = call('activity.upsert', payload).data.record
    expect(call('activity.upsert', payload).data.record.id).toBe(row.id)
    expect(context.getSheetRecords('activity')).toHaveLength(1)
    expect(call('activity.upsert', { ...row, create: false, status: 'terealisasi' }).ok).toBe(true)
    expect(
      call('activity.upsert', { ...row, create: false, deskripsi: 'Versi lama' }).error.code,
    ).toBe('CONFLICT')
  })
  it('bulk status memvalidasi seluruh daftar sebelum menulis dan menghormati versi', () => {
    const { call, context, generate } = setup()
    generate()
    const rows = context.getSheetRecords('activity').slice(0, 2)
    const invalid = [
      { id: rows[0].id, updated_at: rows[0].updated_at },
      { id: rows[1].id, updated_at: 'stale' },
    ]
    expect(
      call('activity.bulkStatus', { changes: invalid, status: 'terealisasi' }).error.code,
    ).toBe('CONFLICT')
    expect(context.getSheetRecords('activity').every((row) => row.status === 'rencana')).toBe(true)
    expect(
      call('activity.bulkStatus', {
        changes: rows.map(({ id, updated_at }) => ({ id, updated_at })),
        status: 'terealisasi',
      }).data.records,
    ).toHaveLength(2)
  })
  it('bulan final menolak generate, edit, pindah dari/ke bulan final, bulk, delete, dan restore', () => {
    const { call, context } = setup()
    const first = call('activity.upsert', fixture.activity).data.record
    const deleted = call('activity.delete', first).data.record
    const november = call('activity.upsert', { ...fixture.activity, tanggal: '2026-11-02' }).data
      .record
    context.withLock(() =>
      context.appendSheetRecord('report_month', { tahun: 2026, bulan: 10, status: 'final' }),
    )
    for (const [action, payload] of [
      ['plan.generate', { month: '2026-10', dryRun: false }],
      ['activity.upsert', { ...deleted, tanggal: '2026-10-02', id: undefined }],
      ['activity.upsert', { ...november, tanggal: '2026-10-02' }],
      ['activity.restore', deleted],
    ])
      expect(call(action, payload).error.code).toBe('FORBIDDEN_STATE')
    const active = context.withLock(() =>
      context.appendSheetRecord('activity', { ...fixture.activity, id: 'locked-test' }),
    )
    for (const [action, payload] of [
      ['activity.delete', active],
      ['activity.upsert', { ...active, tanggal: '2026-11-01' }],
      [
        'activity.bulkStatus',
        { changes: [{ id: active.id, updated_at: active.updated_at }], status: 'terealisasi' },
      ],
    ])
      expect(call(action, payload).error.code).toBe('FORBIDDEN_STATE')
    expect(context.getSheetRecords('activity').find((row) => row.id === 'locked-test').status).toBe(
      'rencana',
    )
  })
  it('list hanya memuat bulan pilihan; hapus dan pulihkan tidak menghapus permanen', () => {
    const { call, context } = setup()
    const row = call('activity.upsert', fixture.activity).data.record
    expect(call('activity.list', { month: '2026-10' }).data.records).toHaveLength(1)
    expect(call('activity.list', { month: '2026-11' }).data.records).toHaveLength(0)
    const deleted = call('activity.delete', row).data.record
    expect(context.getSheetRecords('activity', true)).toHaveLength(1)
    expect(call('activity.restore', deleted).data.record.deleted).toBe(0)
  })
  it('seluruh action M2 mewajibkan token dan mencatat audit', () => {
    const { request, call, context } = setup()
    for (const action of [
      'plan.generate',
      'activity.list',
      'activity.upsert',
      'activity.bulkStatus',
      'activity.delete',
      'activity.restore',
    ])
      expect(request(action, {}).error.code).toBe('UNAUTHENTICATED')
    call('activity.upsert', fixture.activity)
    expect(context.getSheetRecords('audit_log').some((row) => row.aksi === 'activity.upsert')).toBe(
      true,
    )
  })
})
