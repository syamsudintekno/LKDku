// Local manual testing only. Uses Google service doubles; never opens a real spreadsheet.
import { createServer as createHttpServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { createServer } from './appsScriptServer.mjs'

const { context } = createServer()
const dashboardFixture = process.argv.includes('--dashboard-fixture')
if (
  process.argv.includes('--activity-fixture') ||
  process.argv.includes('--report-fixture') ||
  dashboardFixture
) {
  const fixture = JSON.parse(readFileSync(new URL('./activity.json', import.meta.url), 'utf8'))
  context.withLock(() => {
    for (const [name, rows] of [
      ['skp_year', fixture.years],
      ['skp_item', fixture.items],
      ['skp_template', fixture.templates],
    ])
      for (const row of rows)
        context.appendSheetRecord(name, {
          ...row,
          ...(name === 'skp_item'
            ? {
                rencana_hasil_kerja: 'Pengajaran uji',
                indikator: 'Jumlah kelas',
                target_tahunan: 4,
              }
            : {}),
          ...(name === 'skp_template' ? { pengecualian: JSON.stringify(row.pengecualian) } : {}),
        })
    if (process.argv.includes('--report-fixture') || dashboardFixture) {
      for (const row of context.getSheetRecords('profile'))
        context.updateSheetRecord('profile', row.id, {
          value: row.key.includes('nip')
            ? '000000000000000000'
            : row.key === 'folder_pdf_id'
              ? 'fixture-folder-for-pdf'
              : row.key === 'nama'
                ? 'Dosen Uji'
                : 'Isian profil uji',
        })
      for (const tanggal of ['2026-10-01', '2026-10-03', '2026-10-17'])
        context.appendSheetRecord('activity', {
          ...fixture.activity,
          tanggal,
          status: 'terealisasi',
        })
      context.appendSheetRecord('activity', {
        ...fixture.activity,
        tanggal: '2026-10-02',
        deskripsi: 'Rencana kegiatan uji',
        status: 'rencana',
      })
    }
    if (dashboardFixture) {
      const today = context.currentJakartaDate()
      context.appendSheetRecord('activity', {
        ...fixture.activity,
        tanggal: today,
        deskripsi: 'Kelas hari ini untuk uji',
        status: 'rencana',
      })
      context.appendSheetRecord('activity', {
        ...fixture.activity,
        tanggal: today,
        deskripsi: 'Draft dengan satuan berbeda',
        satuan: 'Draft',
        status: 'terealisasi',
      })
      context.appendSheetRecord('activity', {
        ...fixture.activity,
        tanggal: today,
        deskripsi: 'Rapat insidental uji',
        unsur: 'Penunjang',
        satuan: 'Kegiatan',
        sumber: 'insidental',
        skp_item_id: '',
        template_id: '',
        alasan_insidental: 'Undangan mendadak untuk pengujian',
        status: 'terealisasi',
      })
    }
  })
}
const allowedOrigins = new Set(['http://127.0.0.1:3002', 'http://localhost:3002'])
createHttpServer(async (request, response) => {
  const origin = request.headers.origin
  if (origin && !allowedOrigins.has(origin)) {
    response.writeHead(403).end()
    return
  }
  response.setHeader('Access-Control-Allow-Origin', origin || 'http://127.0.0.1:3002')
  response.setHeader('Content-Type', 'application/json')
  if (request.method !== 'POST') {
    response.writeHead(405).end()
    return
  }
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > 3 * 1024 * 1024) {
      response.writeHead(413).end()
      return
    }
  }
  response.end(context.doPost({ postData: { contents: body } }).content)
}).listen(3001, '127.0.0.1', () => console.log('Test-only API: http://127.0.0.1:3001'))
