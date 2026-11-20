// Local manual testing only. Uses Google service doubles; never opens a real spreadsheet.
import { createServer as createHttpServer } from 'node:http'
import { createServer } from './appsScriptServer.mjs'

const { context } = createServer()
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
    if (body.length > 8192) {
      response.writeHead(413).end()
      return
    }
  }
  response.end(context.doPost({ postData: { contents: body } }).content)
}).listen(3001, '127.0.0.1', () => console.log('Test-only API: http://127.0.0.1:3001'))
