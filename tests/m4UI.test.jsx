import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeedbackProvider } from '../src/components/ui/FeedbackProvider'
import { MotionProvider } from '../src/motion/useMotionPref'
import BackupSettings from '../src/views/pengaturan/BackupSettings'
import SecuritySettings from '../src/views/pengaturan/SecuritySettings'
import Beranda from '../src/views/beranda/Beranda'
import MobileNav from '../src/components/MobileNav'
import UnitSettings from '../src/views/pengaturan/UnitSettings'
import { buildDashboard } from '../src/domain/dashboard'
import { currentJakartaDate } from '../src/domain/dateId'
import fixture from './fixtures/activity.json'
vi.mock('../src/config', () => ({ API_URL: 'https://example.test/api' }))
function open(element, data) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  if (data) client.setQueryData(['dashboard', data.month], data)
  render(
    <MemoryRouter initialEntries={['/harian']}>
      <QueryClientProvider client={client}>
        <MotionProvider>
          <FeedbackProvider>{element}</FeedbackProvider>
        </MotionProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
  return client
}
const response = (data) => ({ ok: true, json: async () => ({ ok: true, data }) })
it('dashboard shows actual mismatched units separately and preserves values after a failed mutation', async () => {
  const today = currentJakartaDate(),
    data = buildDashboard({
      ...fixture,
      month: today.slice(0, 7),
      today,
      items: [{ ...fixture.items[0], target_tahunan: 4 }],
      records: [
        { ...fixture.activity, id: 'plan', tanggal: today, status: 'rencana', updated_at: 'v' },
        {
          ...fixture.activity,
          id: 'draft',
          deskripsi: 'Draft terpisah untuk uji',
          tanggal: today,
          status: 'terealisasi',
          satuan: 'Draft',
          jumlah: 2,
        },
      ],
    })
  vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) =>
    JSON.parse(options.body).action === 'dashboard.summary'
      ? Promise.resolve(response(data))
      : Promise.reject(Error('offline')),
  )
  open(<Beranda />, data)
  expect(screen.getByText(/2 Draft.*ditampilkan terpisah/)).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('checkbox', { name: `Terealisasi: ${fixture.activity.deskripsi}` }),
  )
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Tidak bisa menghubungi/))
  expect(screen.getByRole('progressbar', { name: 'Capaian P-UJI' })).toHaveAttribute('value', '0')
})
it('backup import requires server preview and sends the reviewed version', async () => {
  const calls = []
  vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
    const request = JSON.parse(options.body)
    calls.push(request)
    return Promise.resolve(
      response(
        request.payload.dryRun
          ? {
              version: 'checked-version',
              count: 1,
              summary: [{ sheet: 'skp_year', added: 1, skipped: 0 }],
            }
          : { count: 1, summary: [] },
      ),
    )
  })
  open(<BackupSettings />)
  expect(screen.getByRole('button', { name: 'Periksa pemulihan' })).toBeDisabled()
  const file = new File(['{}'], 'fake-backup.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', {
    value: async () => JSON.stringify({ schemaVersion: 1, tables: {} }),
  })
  fireEvent.change(screen.getByLabelText(/Berkas cadangan JSON/), { target: { files: [file] } })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Periksa pemulihan' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Periksa pemulihan' }))
  await screen.findByText('Pratinjau: 1 record akan dipulihkan')
  vi.useFakeTimers()
  try {
    fireEvent.keyDown(screen.getByRole('button', { name: 'Tahan untuk pulihkan data' }), {
      key: 'Enter',
    })
    await act(async () => vi.advanceTimersByTimeAsync(1000))
  } finally {
    vi.useRealTimers()
  }
  await waitFor(() => expect(calls.some((call) => call.payload.dryRun === false)).toBe(true))
  expect(calls.find((call) => call.payload.dryRun === false).payload.version).toBe(
    'checked-version',
  )
})
it('mismatched password confirmation never submits credentials', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response([]))
  open(<SecuritySettings />)
  fireEvent.change(screen.getByLabelText('Password saat ini'), {
    target: { value: 'test-only-password' },
  })
  fireEvent.change(screen.getByLabelText('Password baru', { exact: true }), {
    target: { value: 'new-test-only-password' },
  })
  fireEvent.change(screen.getByLabelText('Konfirmasi password baru'), {
    target: { value: 'different-test-password' },
  })
  fireEvent.submit(
    screen.getByRole('button', { name: 'Ganti password dan keluar' }).closest('form'),
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Konfirmasi password belum sama.')
  expect(
    fetch.mock.calls.some(
      ([, options]) => JSON.parse(options.body).action === 'auth.changePassword',
    ),
  ).toBe(false)
})
it('mobile navigation exposes the selected destination', () => {
  open(<MobileNav />)
  expect(screen.getByRole('link', { name: 'Harian' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getAllByRole('link')).toHaveLength(5)
})
it('editing units after a successful save enables the next save', async () => {
  let state = {
    version: 'one',
    config: {
      unsur_list: ['Pendidikan', 'Penelitian', 'Pengabdian', 'Penunjang'],
      satuan_list: ['Kelas'],
    },
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
    const body = JSON.parse(options.body)
    if (body.action === 'config.update')
      state = { version: 'two', config: { ...state.config, satuan_list: body.payload.satuan_list } }
    return Promise.resolve(response(state))
  })
  open(<UnitSettings />)
  const field = await screen.findByLabelText('Satuan, satu per baris')
  fireEvent.change(field, { target: { value: 'Kelas\nArtikel' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan satuan' }))
  await screen.findByRole('button', { name: 'Tersimpan' })
  fireEvent.change(field, { target: { value: 'Kelas\nArtikel\nModul' } })
  expect(screen.getByRole('button', { name: 'Simpan satuan' })).toBeEnabled()
})
