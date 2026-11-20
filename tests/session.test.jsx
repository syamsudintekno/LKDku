import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireSession from '../src/components/RequireSession'
import { setToken, getToken } from '../src/api/client'
import { useLogout } from '../src/api/auth'

vi.mock('../src/config', () => ({ API_URL: 'https://example.test/api' }))
const client = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
const openProtected = () =>
  render(
    <QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={['/beranda']}>
        <Routes>
          <Route path="/login" element={<p>Halaman masuk</p>} />
          <Route
            path="*"
            element={
              <RequireSession>
                <p>Data pribadi</p>
              </RequireSession>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

describe('Pemeriksaan sesi halaman kerja', () => {
  it('mengalihkan pengunjung tanpa token ke login', () => {
    openProtected()
    expect(screen.getByText('Halaman masuk')).toBeInTheDocument()
    expect(screen.queryByText('Data pribadi')).not.toBeInTheDocument()
  })
  it('menunggu verifikasi server sebelum menampilkan halaman', async () => {
    setToken('test-session')
    let resolveResponse
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve
        }),
    )
    openProtected()
    expect(screen.getByText('Memeriksa sesi...')).toBeInTheDocument()
    expect(screen.queryByText('Data pribadi')).not.toBeInTheDocument()
    resolveResponse({ ok: true, json: async () => ({ ok: true, data: { user: { id: 'test' } } }) })
    expect(await screen.findByText('Data pribadi')).toBeInTheDocument()
  })
  it('menghapus token kedaluwarsa dan kembali ke login', async () => {
    setToken('expired-session')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: false,
        error: { code: 'UNAUTHENTICATED', message: 'Sesi kedaluwarsa.' },
      }),
    })
    openProtected()
    expect(await screen.findByText('Halaman masuk')).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })
  it('menampilkan kegagalan jaringan tanpa membocorkan halaman', async () => {
    setToken('test-session')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    openProtected()
    expect(await screen.findByRole('alert')).toHaveTextContent('Tidak bisa menghubungi server')
    expect(screen.queryByText('Data pribadi')).not.toBeInTheDocument()
    expect(getToken()).toBe('test-session')
  })
  it('membersihkan token dan cache walaupun logout server gagal', async () => {
    setToken('test-session')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    const cache = client()
    cache.setQueryData(['private'], { name: 'Data uji' })
    const Logout = () => {
      const logout = useLogout()
      return <button onClick={() => logout.mutate()}>Keluar</button>
    }
    render(
      <QueryClientProvider client={cache}>
        <Logout />
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))
    await waitFor(() => expect(getToken()).toBeNull())
    expect(cache.getQueryData(['private'])).toBeUndefined()
  })
})
