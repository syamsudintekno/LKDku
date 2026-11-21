// @vitest-environment node
import { it, expect } from 'vitest'
import { createServer } from './fixtures/appsScriptServer.mjs'
import fixture from './fixtures/activity.json'

function setup() {
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
    for (const row of server.context.getSheetRecords('profile'))
      server.context.updateSheetRecord('profile', row.id, {
        value: row.key.includes('nip')
          ? '000000000000000000'
          : row.key === 'folder_pdf_id'
            ? 'fake-folder-for-tests'
            : 'Profil uji',
      })
    server.context.appendSheetRecord('activity', { ...fixture.activity, status: 'terealisasi' })
  })
  let count = 0
  const realCreateReportPdf = server.context.createReportPdf
  server.context.createReportPdf = () => ({
    id: `fake-pdf-${++count}`,
    url: 'https://drive.google.com/file/d/fake-pdf/view',
  })
  const preview = () => call('report.preview', { month: '2026-10' })
  const finalize = (version) =>
    call('report.finalize', {
      month: '2026-10',
      version: version || preview().data.version,
      confirmWarnings: true,
    })
  return { ...server, call, preview, finalize, count: () => count, realCreateReportPdf }
}
it('finalizes once, freezes snapshots, rejects activities and requires reason/version to reopen', () => {
  const s = setup()
  const version = s.preview().data.version
  const final = s.finalize(version)
  expect(final.ok).toBe(true)
  expect(final.data.record.status).toBe('final')
  expect(s.finalize(version).ok).toBe(true)
  expect(s.count()).toBe(1)
  const row = s.context.getSheetRecords('activity')[0]
  expect(s.call('activity.upsert', { ...row, deskripsi: 'Tidak boleh' }).error.code).toBe(
    'FORBIDDEN_STATE',
  )
  s.context.withLock(() =>
    s.context.updateSheetRecord(
      'profile',
      s.context.getSheetRecords('profile').find((r) => r.key === 'nama').id,
      { value: 'Berubah' },
    ),
  )
  expect(s.preview().data.report.profile.nama).toBe('Profil uji')
  expect(
    s.call('report.reopen', {
      month: '2026-10',
      updated_at: final.data.record.updated_at,
      reason: '',
    }).error.code,
  ).toBe('VALIDATION')
  expect(
    s.call('report.reopen', { month: '2026-10', updated_at: 'basi', reason: 'Koreksi uji' }).error
      .code,
  ).toBe('CONFLICT')
  expect(
    s.call('report.reopen', {
      month: '2026-10',
      updated_at: final.data.record.updated_at,
      reason: 'Koreksi uji',
    }).ok,
  ).toBe(true)
  expect(s.call('activity.upsert', { ...row, deskripsi: 'Boleh setelah reopen' }).ok).toBe(true)
})
it('rejects stale previews, unconfirmed warnings and PDF failure without locking month', () => {
  const s = setup()
  const version = s.preview().data.version
  expect(s.call('report.finalize', { month: '2026-10', version }).error.code).toBe('VALIDATION')
  const row = s.context.getSheetRecords('activity')[0]
  s.call('activity.upsert', { ...row, deskripsi: 'Perubahan uji' })
  expect(s.finalize(version).error.code).toBe('CONFLICT')
  s.context.createReportPdf = () => {
    throw Error('PDF unavailable')
  }
  expect(s.finalize().ok).toBe(false)
  expect(s.context.getSheetRecords('report_month')).toHaveLength(0)
  expect(
    s.call('activity.upsert', {
      ...s.context.getSheetRecords('activity')[0],
      catatan: 'Tetap terbuka',
    }).ok,
  ).toBe(true)
})
it('all report endpoints reject unauthenticated requests', () => {
  const s = createServer()
  for (const action of ['preview', 'validate', 'finalize', 'reopen', 'exportPdf', 'list'])
    expect(s.request(`report.${action}`, { month: '2026-10' }).error.code).toBe('UNAUTHENTICATED')
})
it('renders the actual escaped template and recreates missing PDFs only from frozen data', () => {
  const s = setup()
  s.context.createReportPdf = s.realCreateReportPdf
  const row = s.context.getSheetRecords('activity')[0]
  s.call('activity.upsert', { ...row, deskripsi: '<script>Data uji</script>' })
  const final = s.finalize()
  expect(final.ok).toBe(true)
  expect(s.pdfAttempts).toHaveLength(1)
  expect(s.pdfAttempts[0].mime).toBe('application/pdf')
  expect(s.pdfAttempts[0].html).toContain('&lt;script&gt;Data uji&lt;/script&gt;')
  expect(s.pdfAttempts[0].html).not.toContain('<script>Data uji</script>')
  expect(s.pdfAttempts[0].html).not.toContain('Belum terealisasi')
  const payload = { month: '2026-10', updated_at: final.data.record.updated_at }
  expect(s.call('report.exportPdf', payload).ok).toBe(true)
  expect(s.pdfAttempts).toHaveLength(1)
  s.driveFiles.get(final.data.record.pdf_file_id).setTrashed(true)
  s.context.withLock(() =>
    s.context.updateSheetRecord(
      'profile',
      s.context.getSheetRecords('profile').find((r) => r.key === 'nama').id,
      { value: 'Nama diubah sesudah final' },
    ),
  )
  expect(s.call('report.exportPdf', payload).ok).toBe(true)
  expect(s.pdfAttempts).toHaveLength(2)
  expect(s.pdfAttempts[1].html).toBe(s.pdfAttempts[0].html)
})
it('moves a newly created PDF to Trash if saving its final record fails', () => {
  const s = setup(),
    commit = s.context.commitReference
  s.context.createReportPdf = s.realCreateReportPdf
  s.context.commitReference = (name, changes) => {
    if (name === 'report_month') throw Error('Sheet unavailable')
    return commit(name, changes)
  }
  expect(s.finalize().ok).toBe(false)
  expect(s.driveFiles.size).toBe(1)
  expect([...s.driveFiles.values()][0].isTrashed()).toBe(true)
  expect(s.context.getSheetRecords('report_month')).toHaveLength(0)
})
it('rejects oversize snapshots before creating a Drive file', () => {
  const s = setup()
  s.context.withLock(() => {
    for (let i = 0; i < 30; i++)
      s.context.appendSheetRecord('activity', {
        ...fixture.activity,
        status: 'terealisasi',
        deskripsi: 'x'.repeat(2000),
      })
  })
  expect(s.preview().data.validation.errors.some((row) => row.code === 'SNAPSHOT_SIZE')).toBe(true)
  expect(s.finalize().error.code).toBe('VALIDATION')
  expect(s.count()).toBe(0)
})
it('validates the optional profile logo without adding sheet columns', () => {
  const s = setup(),
    profile = s.call('profile.get').data
  expect(
    s.call('profile.update', {
      version: profile.version,
      profile: { ...profile.profile, logo_kop: 'data:image/svg+xml;base64,PHN2Zz4=' },
    }).error.code,
  ).toBe('VALIDATION')
  const logo =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII='
  const saved = s.call('profile.update', {
    version: profile.version,
    profile: { ...profile.profile, logo_kop: logo },
  })
  expect(saved.ok).toBe(true)
  expect(saved.data.profile.logo_kop).toBe(logo)
  expect(s.preview().data.report.profile.logo_kop).toBe(logo)
  expect(s.preview().data.validation.warnings.some((row) => row.code === 'NO_LOGO')).toBe(false)
})
