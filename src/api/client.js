/**
 * client.js - API Client untuk komunikasi dengan Web App Google Apps Script
 */

import { API_URL } from '../config'

const TOKEN_KEY = 'lkb_auth_token'
const REMEMBER_KEY = 'lkb_remember_me'

export function getToken() {
  const isRemember = localStorage.getItem(REMEMBER_KEY) === 'true'
  if (isRemember) {
    return localStorage.getItem(TOKEN_KEY)
  }
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

export function setToken(token, remember = false) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true')
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REMEMBER_KEY)
}

export function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * apiCall - Mengirim request ke Apps Script Web App
 */
export async function apiCall(action, payload = {}) {
  const url = API_URL
  if (!url) {
    // Mode demo/pengembangan offline bila belum ada VITE_API_URL
    console.warn('VITE_API_URL belum dikonfigurasi. Menggunakan fallback mock.')
    if (action === 'auth.login') {
      if (payload.username === 'syam' && payload.password === 'Admin123!') {
        const mockToken = 'mock-token-' + Date.now()
        setToken(mockToken, payload.remember)
        return {
          token: mockToken,
          user: { id: 'u-1', username: 'syam' },
          profile: {
            nama: 'Ahmad Syamsudin, M.Kom.',
            nip: '198809022015031004',
            jabatan: 'Lektor - Penata Tingkat I / III-d',
          },
        }
      } else {
        const err = new Error('Username atau password salah.')
        err.code = 'UNAUTHENTICATED'
        throw err
      }
    }
    if (action === 'auth.me') {
      const token = getToken()
      if (!token) {
        const err = new Error('Sesi tidak ditemukan.')
        err.code = 'UNAUTHENTICATED'
        throw err
      }
      return {
        user: { id: 'u-1', username: 'syam' },
        profile: {
          nama: 'Ahmad Syamsudin, M.Kom.',
          nip: '198809022015031004',
          jabatan: 'Lektor - Penata Tingkat I / III-d',
        },
      }
    }
    if (action === 'auth.logout') {
      clearToken()
      return { success: true }
    }
  }

  const token = getToken()
  const body = {
    action,
    token: token || undefined,
    payload,
    requestId: generateUuid(),
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = new Error(`Server galat: HTTP ${response.status}`)
    error.code = 'HTTP_ERROR'
    throw error
  }

  const result = await response.json()

  if (!result.ok) {
    const err = new Error(result.error?.message || 'Terjadi kesalahan sistem.')
    err.code = result.error?.code || 'INTERNAL'
    if (err.code === 'UNAUTHENTICATED') {
      clearToken()
    }
    throw err
  }

  return result.data
}
