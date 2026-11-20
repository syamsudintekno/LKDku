import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import { createHash, randomUUID } from 'node:crypto'

export const createServer = () => {
  const sheets = new Map()
  const properties = new Map([
    ['SPREADSHEET_ID', 'test-spreadsheet'],
    ['PEPPER', 'test-only-pepper'],
  ])
  let locked = false
  const sheet = (name) => {
    const rows = []
    const instance = {
      getDataRange: () => ({ getValues: () => rows.map((row) => [...row]) }),
      getLastRow: () => rows.length,
      getLastColumn: () => rows[0]?.length || 0,
      appendRow: (row) => {
        if (!locked) throw Error('Write without lock')
        rows.push([...row])
      },
      setFrozenRows: () => {},
      getRange: (row, col, height, width) => {
        const range = {
          getValues: () =>
            Array.from({ length: height }, (_, r) =>
              Array.from({ length: width }, (_, c) => rows[row - 1 + r]?.[col - 1 + c] ?? ''),
            ),
          setValues: (values) => {
            if (!locked) throw Error('Write without lock')
            values.forEach((valuesRow, r) => {
              rows[row - 1 + r] ||= []
              valuesRow.forEach((value, c) => {
                rows[row - 1 + r][col - 1 + c] = value
              })
            })
          },
          setFontWeight: () => range,
          setBackground: () => range,
          setFontColor: () => range,
        }
        return range
      },
    }
    sheets.set(name, instance)
    return instance
  }
  const spreadsheet = { getSheetByName: (name) => sheets.get(name), insertSheet: sheet }
  const props = {
    getProperty: (key) => properties.get(key) || null,
    setProperty: (key, value) => properties.set(key, value),
    deleteProperty: (key) => properties.delete(key),
  }
  const context = createContext({
    Date,
    Logger: { log: () => {} },
    PropertiesService: { getScriptProperties: () => props },
    SpreadsheetApp: { openById: () => spreadsheet },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (locked) throw Error('Nested lock')
          locked = true
          return true
        },
        releaseLock: () => {
          locked = false
        },
      }),
    },
    Utilities: {
      getUuid: randomUUID,
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (_, input) =>
        Array.from(
          createHash('sha256')
            .update(
              typeof input === 'string' ? input : Buffer.from(input.map((byte) => byte & 255)),
            )
            .digest(),
        ),
      formatDate: (date, zone, format) =>
        format === 'yyyy' ? String(date.getUTCFullYear()) : date.toISOString(),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (content) => ({
        content,
        setMimeType() {
          return this
        },
      }),
    },
  })
  for (const file of [
    'util.gs',
    'data.gs',
    'setup.gs',
    'auth.gs',
    'schedule.gs',
    'reference.gs',
    'profile.gs',
    'skp.gs',
    'holiday.gs',
    'Code.gs',
  ]) {
    runInContext(
      readFileSync(new URL(`../../apps-script/${file}`, import.meta.url), 'utf8'),
      context,
      { filename: file },
    )
  }
  context.initSheets()
  context.setupUser('test-user', 'test-only-password')
  const request = (action, payload, token) =>
    JSON.parse(
      context.doPost({ postData: { contents: JSON.stringify({ action, payload, token }) } })
        .content,
    )
  const login = () =>
    request('auth.login', { username: 'test-user', password: 'test-only-password' })
  return { context, properties, request, login, sheets }
}
