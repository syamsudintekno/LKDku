// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createServer } from './fixtures/appsScriptServer.mjs'

describe('Apps Script M0 dengan layanan Google simulasi', () => {
  it('menginisialisasi 11 sheet tanpa profil nyata, password bawaan, atau duplikasi', () => {
    const { context, sheets, properties } = createServer()
    expect(sheets.size).toBe(11)
    expect(context.getSheetRecords('profile').every((row) => row.value === '')).toBe(true)
    context.initSheets()
    expect(context.getSheetRecords('profile')).toHaveLength(14)
    expect(() => context.setupUser()).toThrow()
    expect(properties.get('SPREADSHEET_ID')).toBe('test-spreadsheet')
  })
  it('menghapus kredensial sementara setelah setup dari editor', () => {
    const { context, properties } = createServer()
    properties.set('INITIAL_USERNAME', 'test-editor-user')
    properties.set('INITIAL_PASSWORD', 'test-only-editor-password')
    context.setupUser()
    expect(properties.has('INITIAL_PASSWORD')).toBe(false)
    expect(properties.has('INITIAL_USERNAME')).toBe(false)
  })
  it('login → me → logout membatalkan sesi dan hanya menyimpan hash token', () => {
    const { context, request, login } = createServer()
    const result = login()
    expect(result.ok).toBe(true)
    expect(result.data.token).toMatch(/^[a-f0-9]{64}$/)
    const stored = context.getSheetRecords('sessions')[0]
    expect(stored.token_hash).not.toBe(result.data.token)
    expect(request('auth.me', {}, result.data.token).data.user.username).toBe('test-user')
    expect(request('auth.logout', {}, result.data.token).ok).toBe(true)
    expect(request('auth.me', {}, result.data.token).error.code).toBe('UNAUTHENTICATED')
    expect(context.getSheetRecords('audit_log')).toHaveLength(2)
  })
  it('mengakhiri sesi lama ketika akun diatur ulang', () => {
    const { context, request, login } = createServer()
    const token = login().data.token
    context.setupUser('test-user', 'replacement-test-password')
    expect(request('auth.me', {}, token).error.code).toBe('UNAUTHENTICATED')
  })
  it('mengunci akun pada kegagalan kelima dan menolak login selama terkunci', () => {
    const { request, login } = createServer()
    for (let i = 0; i < 4; i++)
      expect(
        request('auth.login', { username: 'test-user', password: 'wrong-test' }).error.code,
      ).toBe('UNAUTHENTICATED')
    expect(
      request('auth.login', { username: 'test-user', password: 'wrong-test' }).error.code,
    ).toBe('LOCKED')
    expect(login().error.code).toBe('LOCKED')
  })
  it('menolak token kosong, salah, dan kedaluwarsa untuk semua action privat', () => {
    const { context, request, login } = createServer()
    for (const action of ['auth.me', 'auth.logout', 'bootstrap', 'profile.update', 'unknown']) {
      expect(request(action, {}).error.code).toBe('UNAUTHENTICATED')
      expect(request(action, {}, 'f'.repeat(64)).error.code).toBe('UNAUTHENTICATED')
    }
    const token = login().data.token
    const session = context.getSheetRecords('sessions')[0]
    context.withLock(() =>
      context.updateSheetRecord('sessions', session.id, { expires_at: '2000-01-01T00:00:00Z' }),
    )
    expect(request('bootstrap', {}, token).error.code).toBe('UNAUTHENTICATED')
  })
  it('menetapkan masa sesi 12 jam atau 14 hari sesuai pilihan pengguna', () => {
    const { context, request } = createServer()
    const start = Date.now()
    for (const remember of [false, true]) {
      expect(
        request('auth.login', { username: 'test-user', password: 'test-only-password', remember })
          .ok,
      ).toBe(true)
      const session = context.getSheetRecords('sessions').at(-1)
      const expected = (remember ? 14 * 24 : 12) * 3600 * 1000
      expect(new Date(session.expires_at).getTime() - start).toBeGreaterThanOrEqual(expected)
      expect(new Date(session.expires_at).getTime() - start).toBeLessThan(expected + 5000)
    }
  })
  it('menolak permintaan tidak valid dan tidak membocorkan galat internal', () => {
    const { context, request, properties } = createServer()
    for (const value of ['null', '[]', '{', '{"action":"auth.login","payload":1}']) {
      expect(JSON.parse(context.doPost({ postData: { contents: value } }).content).error.code).toBe(
        'VALIDATION',
      )
    }
    expect(request('auth.login', { username: [], password: {} }).error.code).toBe('VALIDATION')
    properties.delete('PEPPER')
    const response = request('auth.login', {
      username: 'test-user',
      password: 'test-only-password',
    })
    expect(response.error.code).toBe('INTERNAL')
    expect(response.error.message).not.toContain('PEPPER')
  })
})
