import { describe, it, expect, vi } from 'vitest'
import { apiCall, setToken, getToken } from '../src/api/client'
vi.mock('../src/config', () => ({ API_URL: '' }))

describe('Konfigurasi API', () => {
  it('menolak login saat API belum dikonfigurasi', async () => {
    const request = vi.spyOn(globalThis, 'fetch')
    await expect(
      apiCall('auth.login', { username: 'test', password: 'test-only' }),
    ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' })
    expect(getToken()).toBeNull()
    expect(request).not.toHaveBeenCalled()
  })
  it('tidak memakai token localStorage tanpa persetujuan ingat saya', () => {
    localStorage.setItem('lkb_auth_token', 'orphaned-test-token')
    expect(getToken()).toBeNull()
    setToken('session-test', false)
    expect(getToken()).toBe('session-test')
    expect(localStorage.getItem('lkb_auth_token')).toBeNull()
  })
})
