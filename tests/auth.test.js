import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, clearToken } from '../src/api/client'

describe('Auth Client Storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('menyimpan token di sessionStorage saat remember = false', () => {
    setToken('token-abc-123', false)
    expect(sessionStorage.getItem('lkb_auth_token')).toBe('token-abc-123')
    expect(localStorage.getItem('lkb_auth_token')).toBeNull()
    expect(getToken()).toBe('token-abc-123')
  })

  it('menyimpan token di localStorage saat remember = true (ingat saya 14 hari)', () => {
    setToken('token-xyz-789', true)
    expect(localStorage.getItem('lkb_auth_token')).toBe('token-xyz-789')
    expect(localStorage.getItem('lkb_remember_me')).toBe('true')
    expect(getToken()).toBe('token-xyz-789')
  })

  it('menghapus token di sessionStorage dan localStorage saat logout / clearToken', () => {
    setToken('token-xyz-789', true)
    clearToken()
    expect(getToken()).toBeNull()
    expect(localStorage.getItem('lkb_auth_token')).toBeNull()
    expect(sessionStorage.getItem('lkb_auth_token')).toBeNull()
  })
})
