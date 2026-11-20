import React from 'react'
import { it, expect, vi } from 'vitest'
import { act, render, renderHook, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useReferenceMutation, optimisticReference } from '../src/api/reference'
import { FeedbackProvider } from '../src/components/ui/FeedbackProvider'
import Skp from '../src/views/skp/Skp'
import { currentJakartaYear } from '../src/domain/dateId'

vi.mock('../src/config', () => ({ API_URL: 'https://example.test/api' }))
it('mengembalikan profil optimistis saat server gagal dan menampilkan pesan Indonesia', async () => {
  let rejectRequest
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        rejectRequest = reject
      }),
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const original = {
    profile: { nama: 'Dosen Uji' },
    profileVersion: 'version-test',
    years: [],
    items: [],
    templates: [],
    holidays: [],
    tahun: 2026,
  }
  client.setQueryData(['bootstrap', 2026], original)
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>
      <FeedbackProvider>{children}</FeedbackProvider>
    </QueryClientProvider>
  )
  const { result } = renderHook(() => useReferenceMutation('profile.update'), { wrapper })
  act(() => result.current.mutate({ profile: { nama: 'Perubahan uji' }, version: 'version-test' }))
  await waitFor(() =>
    expect(client.getQueryData(['bootstrap', 2026]).profile.nama).toBe('Perubahan uji'),
  )
  await act(async () => rejectRequest(new Error('offline')))
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(client.getQueryData(['bootstrap', 2026]).profile.nama).toBe('Dosen Uji')
  expect(result.current.error.message).toContain('Tidak bisa menghubungi server')
})
it('menghapus template bersama butir secara optimistis tanpa mengubah data lain', () => {
  const data = {
    items: [{ id: 'a' }, { id: 'b' }],
    templates: [
      { id: 'one', skp_item_id: 'a' },
      { id: 'two', skp_item_id: 'b' },
    ],
  }
  const next = optimisticReference(data, { id: 'a' }, 'skp.item.delete')
  expect(next.items).toEqual([{ id: 'b' }])
  expect(next.templates).toEqual([{ id: 'two', skp_item_id: 'b' }])
  expect(data.items).toHaveLength(2)
})
it('baris impor tidak valid tidak menjatuhkan optimistic update sebelum validasi server', () => {
  const data = { holidays: [], tahun: 2026 }
  expect(() =>
    optimisticReference(data, { rows: [null, { tanggal: '2027-01-01' }] }, 'holiday.import'),
  ).not.toThrow()
  expect(optimisticReference(data, { rows: [null] }, 'holiday.import').holidays).toEqual([])
})

it('tetap menampilkan daftar saat draft SKP kedua untuk tahun yang sama sedang disimpan', async () => {
  let rejectRequest
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        rejectRequest = reject
      }),
  )
  const year = currentJakartaYear()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  client.setQueryData(['bootstrap', year], {
    tahun: year,
    years: [
      {
        id: 'existing-test-year',
        tahun: year,
        status: 'draft',
        created_at: '2026-01-01T00:00:00Z',
        catatan: 'Versi pertama',
      },
    ],
    items: [],
    templates: [],
    holidays: [],
    config: { unsur_list: ['Pendidikan'], satuan_list: ['Kelas'] },
  })
  render(
    <QueryClientProvider client={client}>
      <FeedbackProvider>
        <Skp />
      </FeedbackProvider>
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Buat SKP' }))
  fireEvent.change(screen.getByLabelText('Catatan SKP'), { target: { value: 'Versi kedua uji' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan', exact: true }))
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'SKP yang ditampilkan' }).options).toHaveLength(2),
  )
  expect(screen.getByRole('heading', { name: 'Rencana SKP' })).toBeInTheDocument()
  await act(async () => rejectRequest(new Error('offline')))
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'SKP yang ditampilkan' }).options).toHaveLength(1),
  )
})
