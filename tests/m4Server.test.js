// @vitest-environment node
import { it, expect } from 'vitest'
import { createServer } from './fixtures/appsScriptServer.mjs'
const setup = () => {
  const s = createServer(),
    token = s.login().data.token
  return { ...s, token, call: (action, payload = {}) => s.request(action, payload, token) }
}
it('backup excludes credentials, previews without writing, restores idempotently and rejects stale previews', () => {
  const s = setup()
  const year = s.call('skp.year.upsert', { tahun: 2026, status: 'draft', catatan: 'Uji' }).data
  const document = s.call('backup.export').data.document
  expect(document.tables.skp_year[0].id).toBe(year.id)
  expect(JSON.stringify(document)).not.toMatch(/password_hash|token_hash|test-only-pepper/)
  const target = setup(),
    before = target.context.getSheetRecords('skp_year')
  const preview = target.call('backup.import', { document, dryRun: true })
  expect(preview.ok).toBe(true)
  expect(target.context.getSheetRecords('skp_year')).toEqual(before)
  expect(
    target.call('backup.import', {
      document,
      dryRun: false,
      version: preview.data.version,
      confirmed: true,
    }).ok,
  ).toBe(true)
  expect(target.call('backup.import', { document, dryRun: true }).data.count).toBe(0)
  const stale = target.call('backup.import', { document, dryRun: true })
  target.call('skp.year.upsert', { tahun: 2027, status: 'draft' })
  expect(
    target.call('backup.import', {
      document,
      dryRun: false,
      version: stale.data.version,
      confirmed: true,
    }).error.code,
  ).toBe('CONFLICT')
})
it('invalid business relations are rejected before any write and credentials cannot be imported', () => {
  const s = setup(),
    document = s.call('backup.export').data.document
  document.tables.activity.push({
    id: 'bad',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    deleted: 0,
    tanggal: '2026-10-01',
    deskripsi: 'Uji',
    sumber: 'skp',
    skp_item_id: 'missing',
    status: 'terealisasi',
    unsur: 'Pendidikan',
    satuan: 'Kelas',
    jumlah: 1,
  })
  expect(s.call('backup.import', { document, dryRun: true }).error.code).toBe('VALIDATION')
  expect(s.context.getSheetRecords('activity')).toHaveLength(0)
  document.tables.users = []
  expect(s.call('backup.import', { document, dryRun: true }).error.code).toBe('VALIDATION')
})
it('changing password checks the old password and revokes every session without returning hashes', () => {
  const s = setup()
  expect(
    s.call('auth.changePassword', {
      currentPassword: 'wrong',
      newPassword: 'new-test-only-password',
      confirmation: 'new-test-only-password',
    }).error.code,
  ).toBe('VALIDATION')
  const result = s.call('auth.changePassword', {
    currentPassword: 'test-only-password',
    newPassword: 'new-test-only-password',
    confirmation: 'new-test-only-password',
  })
  expect(result.ok).toBe(true)
  expect(s.call('auth.me').error.code).toBe('UNAUTHENTICATED')
  expect(
    s.request('auth.login', { username: 'test-user', password: 'new-test-only-password' }).ok,
  ).toBe(true)
  expect(JSON.stringify(result)).not.toMatch(/hash|salt|password/)
})
it('dashboard is authenticated and returns safe empty summaries; config uses version checks', () => {
  const s = setup()
  expect(s.request('dashboard.summary', { month: '2026-10' }).error.code).toBe('UNAUTHENTICATED')
  expect(s.call('dashboard.summary', { month: '2026-10' }).data.monthly.realized).toBe(0)
  const config = s.call('config.get').data
  expect(
    s.call('config.update', {
      version: 'old',
      satuan_list: [...config.config.satuan_list, 'Artikel'],
    }).error.code,
  ).toBe('CONFLICT')
  expect(
    s.call('config.update', {
      version: config.version,
      satuan_list: [...config.config.satuan_list, 'Artikel'],
    }).ok,
  ).toBe(true)
})
it('rolls back previously written tables when a later restore write fails', () => {
  const source = setup()
  source.call('skp.year.upsert', { tahun: 2026, status: 'draft' })
  source.call('holiday.upsert', { tanggal: '2026-10-01', keterangan: 'Libur uji', jenis: 'kampus' })
  const document = source.call('backup.export').data.document,
    target = setup()
  const before = target.call('backup.export').data.document.tables,
    preview = target.call('backup.import', { document, dryRun: true })
  const commit = target.context.commitReference
  target.context.commitReference = (name, rows) => {
    if (name === 'holiday') throw Error('Simulated late write failure')
    return commit(name, rows)
  }
  expect(
    target.call('backup.import', {
      document,
      dryRun: false,
      confirmed: true,
      version: preview.data.version,
    }).ok,
  ).toBe(false)
  expect(target.call('backup.export').data.document.tables).toEqual(before)
})
it('restores custom units into a fresh database and refuses credential CSV export', () => {
  const source = setup(),
    config = source.call('config.get').data
  source.call('config.update', {
    version: config.version,
    satuan_list: [...config.config.satuan_list, 'Artikel'],
  })
  const target = setup(),
    document = source.call('backup.export').data.document
  const preview = target.call('backup.import', { document, dryRun: true })
  expect(preview.ok).toBe(true)
  expect(
    target.call('backup.import', {
      document,
      dryRun: false,
      confirmed: true,
      version: preview.data.version,
    }).ok,
  ).toBe(true)
  expect(target.call('config.get').data.config.satuan_list).toContain('Artikel')
  expect(source.call('backup.export', { format: 'csv', sheet: 'sessions' }).error.code).toBe(
    'VALIDATION',
  )
})
it('locks repeated wrong-password changes and exposes no session hashes', () => {
  const s = setup()
  expect(JSON.stringify(s.call('auth.sessions'))).not.toContain('token_hash')
  for (let i = 0; i < 4; i++)
    expect(
      s.call('auth.changePassword', {
        currentPassword: 'wrong',
        newPassword: 'new-test-only-password',
        confirmation: 'new-test-only-password',
      }).error.code,
    ).toBe('VALIDATION')
  expect(
    s.call('auth.changePassword', {
      currentPassword: 'wrong',
      newPassword: 'new-test-only-password',
      confirmation: 'new-test-only-password',
    }).error.code,
  ).toBe('LOCKED')
  expect(
    s.call('auth.changePassword', {
      currentPassword: 'test-only-password',
      newPassword: 'new-test-only-password',
      confirmation: 'new-test-only-password',
    }).error.code,
  ).toBe('LOCKED')
})
it('failure to revoke sessions never changes the password', () => {
  const s = setup(),
    commit = s.context.commitReference,
    before = s.context.getSheetRecords('users')[0].password_hash
  s.context.commitReference = (name, rows) => {
    if (name === 'sessions') throw Error('Unavailable sessions')
    return commit(name, rows)
  }
  expect(
    s.call('auth.changePassword', {
      currentPassword: 'test-only-password',
      newPassword: 'new-test-only-password',
      confirmation: 'new-test-only-password',
    }).ok,
  ).toBe(false)
  expect(s.context.getSheetRecords('users')[0].password_hash).toBe(before)
})
it('restores final snapshots into a fresh database and keeps the restored month read-only', () => {
  const source = setup()
  let year = source.call('skp.year.upsert', { tahun: 2026, status: 'draft' }).data
  const item = source.call('skp.item.upsert', {
    skp_year_id: year.id,
    kode: 'P-01',
    unsur: 'Pendidikan',
    rencana_hasil_kerja: 'Pengajaran uji',
    indikator: 'Jumlah kelas',
    target_tahunan: 4,
    satuan_target: 'Kelas',
    aktif: 1,
  }).data
  year = source.call('skp.year.upsert', { ...year, status: 'aktif' }).data
  source.call('activity.upsert', {
    tanggal: '2026-10-01',
    deskripsi: 'Kelas uji',
    unsur: 'Pendidikan',
    jumlah: 1,
    satuan: 'Kelas',
    sumber: 'skp',
    skp_item_id: item.id,
    status: 'terealisasi',
  })
  const profile = source.call('profile.get').data
  source.call('profile.update', {
    version: profile.version,
    profile: Object.fromEntries(
      Object.keys(profile.profile).map((key) => [
        key,
        key.includes('nip')
          ? '000000000000000000'
          : key === 'folder_pdf_id'
            ? 'fixture-folder-123'
            : 'Profil uji',
      ]),
    ),
  })
  const report = source.call('report.preview', { month: '2026-10' }).data
  expect(
    source.call('report.finalize', {
      month: '2026-10',
      version: report.version,
      confirmWarnings: true,
    }).ok,
  ).toBe(true)
  const document = source.call('backup.export').data.document,
    target = setup()
  const tampered = JSON.parse(JSON.stringify(document)),
    snapshot = JSON.parse(tampered.tables.report_month[0].snapshot_json)
  snapshot.report.rows.find((day) => day.kind === 'activity').records[0].jumlah = 99
  tampered.tables.report_month[0].snapshot_json = JSON.stringify(snapshot)
  expect(target.call('backup.import', { document: tampered, dryRun: true }).error.code).toBe(
    'VALIDATION',
  )
  const preview = target.call('backup.import', { document, dryRun: true })
  expect(preview.ok).toBe(true)
  expect(
    target.call('backup.import', {
      document,
      dryRun: false,
      confirmed: true,
      version: preview.data.version,
    }).ok,
  ).toBe(true)
  expect(target.call('report.preview', { month: '2026-10' }).data.final).toBe(true)
  const row = target.context.getSheetRecords('activity')[0]
  expect(target.call('activity.upsert', { ...row, deskripsi: 'Tidak boleh' }).error.code).toBe(
    'FORBIDDEN_STATE',
  )
})
it('failed rollback blocks further business writes while allowing a recovery export', () => {
  const source = setup()
  source.call('skp.year.upsert', { tahun: 2026, status: 'draft' })
  source.call('holiday.upsert', { tanggal: '2026-10-01', jenis: 'kampus', keterangan: 'Uji' })
  const document = source.call('backup.export').data.document,
    target = setup(),
    preview = target.call('backup.import', { document, dryRun: true })
  const commit = target.context.commitReference,
    yearSheet = target.sheets.get('skp_year'),
    range = yearSheet.getRange
  target.context.commitReference = (name, rows) => {
    if (name === 'holiday') throw Error('Later failure')
    return commit(name, rows)
  }
  yearSheet.getRange = (...args) => ({
    ...range(...args),
    clearContent: () => {
      throw Error('Rollback unavailable')
    },
  })
  expect(
    target.call('backup.import', {
      document,
      dryRun: false,
      confirmed: true,
      version: preview.data.version,
    }).error.code,
  ).toBe('CONFLICT')
  expect(target.call('skp.year.upsert', { tahun: 2027, status: 'draft' }).error.code).toBe(
    'FORBIDDEN_STATE',
  )
  expect(target.call('backup.export').ok).toBe(true)
})
