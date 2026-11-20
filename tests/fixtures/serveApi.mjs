// Local manual testing only. Uses Google service doubles; never opens a real spreadsheet.
import { createServer as createHttpServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { createServer } from './appsScriptServer.mjs'

const { context } = createServer()
if (process.argv.includes('--activity-fixture')) {
  const fixture = JSON.parse(readFileSync(new URL('./activity.json', import.meta.url), 'utf8'))
  context.withLock(() => {
    for (const [name, rows] of [
      ['skp_year', fixture.years],
      ['skp_item', fixture.items],
      ['skp_template', fixture.templates],
    ])
      for (const row of rows) context.appendSheetRecord(name, { ...row })
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
    if (body.length > 1024 * 1024) {
      response.writeHead(413).end()
      return
    }
  }
  response.end(context.doPost({ postData: { contents: body } }).content)
}).listen(3001, '127.0.0.1', () => console.log('Test-only API: http://127.0.0.1:3001'))
