import { expect, it } from 'vitest'
import { buildReport, validateReport, reportFileName } from '../src/domain/report'
import fixture from './fixtures/activity.json'

const profile = Object.fromEntries(
  [
    'nama',
    'nip',
    'jabatan',
    'unit_kerja',
    'satuan_kerja',
    'kop_1',
    'kop_2',
    'alamat_kop',
    'kota_ttd',
    'atasan_nama',
    'atasan_nip',
    'atasan_jabatan',
    'folder_pdf_id',
  ].map((key) => [key, key.includes('nip') ? '000000000000000000' : 'Data uji']),
)
it('final excludes plans, numbers again and distinguishes empty weekdays and working Saturdays', () => {
  const records = [
    { ...fixture.activity, id: 'a', tanggal: '2026-10-03', status: 'terealisasi' },
    { ...fixture.activity, id: 'b', tanggal: '2026-10-01', status: 'rencana' },
  ]
  const final = buildReport({ month: '2026-10', records, profile })
  expect(final.rows.filter((row) => row.kind === 'activity')).toHaveLength(1)
  expect(final.rows.find((row) => row.tanggal === '2026-10-03').records[0].nomor).toBe(1)
  expect(final.rows.some((row) => row.tanggal === '2026-10-01')).toBe(false)
  expect(final.rows.find((row) => row.tanggal === '2026-10-04').kind).toBe('holiday')
  expect(final.tanggal_ttd).toBe('2026-10-31')
  expect(
    buildReport({ month: '2026-10', records, profile, includePlans: true }).rows[0].records[0]
      .status,
  ).toBe('rencana')
})
it('validation separates blocking errors from warnings and does not silently repair records', () => {
  const records = [
    {
      ...fixture.activity,
      status: 'terealisasi',
      sumber: 'insidental',
      skp_item_id: '',
      alasan_insidental: '',
    },
  ]
  const result = validateReport({ month: '2026-10', records, profile: {}, references: fixture })
  expect(result.errors.length).toBeGreaterThan(0)
  expect(result.warnings.some((row) => row.code === 'EMPTY_WORKDAY')).toBe(true)
  expect(records[0].alasan_insidental).toBe('')
})
it('snapshot is detached and filename cannot contain path separators', () => {
  const records = [{ ...fixture.activity, status: 'terealisasi' }]
  const snapshot = buildReport({ month: '2026-10', records, profile })
  records[0].deskripsi = 'Berubah'
  profile.nama = 'Nama berubah'
  expect(snapshot.rows[0].records[0].deskripsi_laporan).not.toContain('Berubah')
  expect(snapshot.profile.nama).not.toBe('Nama berubah')
  expect(reportFileName('Nama / Uji', '2026-10')).toBe('LKB_Nama_Uji_2026_okt.pdf')
})
it('keeps normal monthly snapshots compact by excluding non-report metadata', () => {
  const records = Array.from({ length: 60 }, (_, index) => ({
    ...fixture.activity,
    id: String(index),
    status: 'terealisasi',
    catatan: 'x'.repeat(2000),
  }))
  const snapshot = buildReport({
    month: '2026-10',
    records,
    profile: { nama: 'Pegawai Uji', logo_kop: 'data:image/png;base64,' + 'A'.repeat(18000) },
  })
  expect(JSON.stringify(snapshot).length).toBeLessThan(45000)
  expect(snapshot.rows[0].records[0]).not.toHaveProperty('catatan')
})
it('invalid signature dates produce a validation error instead of an internal error', () => {
  expect(() =>
    buildReport({ month: '2026-10', records: [], profile: {}, tanggal_ttd: '2026-02-30' }),
  ).toThrow(expect.objectContaining({ code: 'VALIDATION' }))
})
