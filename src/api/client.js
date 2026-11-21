/**
 * client.js - API Client untuk komunikasi dengan Web App Google Apps Script
 */

import { API_URL } from '../config'

const TOKEN_KEY = 'lkb_auth_token'
const REMEMBER_KEY = 'lkb_remember_me'

export function getToken() {
  return localStorage.getItem(REMEMBER_KEY) === 'true'
    ? localStorage.getItem(TOKEN_KEY)
    : sessionStorage.getItem(TOKEN_KEY)
}

export function subscribeToken(listener) {
  window.addEventListener('storage', listener)
  window.addEventListener('lkb-session-change', listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener('lkb-session-change', listener)
  }
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
  window.dispatchEvent(new Event('lkb-session-change'))
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REMEMBER_KEY)
  window.dispatchEvent(new Event('lkb-session-change'))
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
export async function apiCall(action, payload = {}, { signal } = {}) {
  const url = API_URL
  if (!url) {
    const error = new Error('Layanan belum dikonfigurasi. Hubungkan API sebelum masuk.')
    error.code = 'NOT_CONFIGURED'
    throw error
  }

  const token = getToken()
  const body = {
    action,
    token: token || undefined,
    payload,
    requestId: generateUuid(),
  }

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('Tidak bisa menghubungi server. Data Anda belum tersimpan. Coba lagi.')
  }

  if (!response.ok) {
    const error = new Error(`Server galat: HTTP ${response.status}`)
    error.code = 'HTTP_ERROR'
    throw error
  }

  const result = await response.json()

  if (signal?.aborted) throw new DOMException('Permintaan dibatalkan.', 'AbortError')

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
