import React from 'react'
import { beforeEach, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionProvider } from '../src/motion/useMotionPref'
import { FeedbackProvider } from '../src/components/ui/FeedbackProvider'
import Laporan from '../src/views/laporan/Laporan'
import { currentJakartaDate } from '../src/domain/dateId'
import { buildReport } from '../src/domain/report'
import { celebrateReport } from '../src/motion/confetti'

vi.mock('../src/config', () => ({ API_URL: 'https://example.test/api' }))
vi.mock('../src/motion/confetti', () => ({ celebrateReport: vi.fn(() => () => {}) }))
beforeEach(() => vi.clearAllMocks())
const response = (data) => ({ ok: true, json: async () => ({ ok: true, data }) })
const month = currentJakartaDate().slice(0, 7)
const initial = () => ({
  final: false,
  version: 'version-1',
  record: null,
  report: buildReport({ month, records: [], profile: { nama: 'Pegawai uji' } }),
  validation: {
    errors: [],
    warnings: [{ code: 'PLANNED', message: 'Rencana tidak ikut final' }],
    planned: 1,
    realized: 1,
    tanggal_ttd: month + '-01',
  },
})
function open(data) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  client.setQueryData(['report', month, undefined], data)
  client.setQueryData(['reports', Number(month.slice(0, 4))], [])
  render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <MotionProvider>
          <FeedbackProvider>
            <Laporan />
          </FeedbackProvider>
        </MotionProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Ekspor' }))
  return client
}
it('confirmation is tied to the reviewed version and errors block finalization', async () => {
  const data = initial(),
    client = open(data)
  const button = () => screen.getByRole('button', { name: 'Tahan untuk finalisasi dan buat PDF' })
  expect(button()).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox'))
  expect(button()).toBeEnabled()
  await act(async () =>
    client.setQueryData(['report', month, undefined], { ...data, version: 'version-2' }),
  )
  await waitFor(() => expect(button()).toBeDisabled())
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  await act(async () =>
    client.setQueryData(['report', month, undefined], {
      ...data,
      validation: { ...data.validation, errors: [{ code: 'PROFILE', message: 'Lengkapi profil' }] },
    }),
  )
  fireEvent.click(screen.getByRole('checkbox'))
  expect(button()).toBeDisabled()
})
it('does not celebrate or announce success before server acknowledgment', async () => {
  const data = initial()
  let resolveSave,
    current = data
  vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
    const request = JSON.parse(options.body)
    if (request.action === 'report.finalize')
      return new Promise((resolve) => {
        resolveSave = resolve
      })
    return Promise.resolve(response(request.action === 'report.list' ? [] : current))
  })
  open(data)
  fireEvent.click(screen.getByRole('checkbox'))
  vi.useFakeTimers()
  try {
    fireEvent.keyDown(screen.getByRole('button', { name: 'Tahan untuk finalisasi dan buat PDF' }), {
      key: 'Enter',
    })
    await act(async () => vi.advanceTimersByTimeAsync(1000))
  } finally {
    vi.useRealTimers()
  }
  await waitFor(() => expect(resolveSave).toBeTypeOf('function'))
  expect(celebrateReport).not.toHaveBeenCalled()
  expect(screen.queryByText('Laporan final dan PDF berhasil tersimpan di Drive.')).toBeNull()
  current = {
    ...data,
    final: true,
    record: {
      status: 'final',
      updated_at: 'saved',
      pdf_url: 'https://drive.google.com/file/d/fake/view',
    },
  }
  await act(async () => resolveSave(response({ record: current.record, alreadyFinal: false })))
  await waitFor(() =>
    expect(
      screen.getByText('Laporan final dan PDF berhasil tersimpan di Drive.'),
    ).toBeInTheDocument(),
  )
  expect(celebrateReport).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Tahan untuk buka kembali' })).toBeDisabled()
})
it('failed finalization preserves the editable report and never celebrates', async () => {
  const data = initial()
  vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
    const action = JSON.parse(options.body).action
    return Promise.resolve(
      action === 'report.finalize'
        ? {
            ok: true,
            json: async () => ({
              ok: false,
              error: { code: 'INTERNAL', message: 'PDF belum dapat dibuat.' },
            }),
          }
        : response(action === 'report.list' ? [] : data),
    )
  })
  open(data)
  fireEvent.click(screen.getByRole('checkbox'))
  vi.useFakeTimers()
  try {
    fireEvent.keyDown(screen.getByRole('button', { name: 'Tahan untuk finalisasi dan buat PDF' }), {
      key: 'Enter',
    })
    await act(async () => vi.advanceTimersByTimeAsync(1000))
  } finally {
    vi.useRealTimers()
  }
  await waitFor(() =>
    expect(screen.getAllByText('PDF belum dapat dibuat.').length).toBeGreaterThan(0),
  )
  expect(screen.queryByRole('link', { name: 'Buka PDF di Drive' })).toBeNull()
  expect(celebrateReport).not.toHaveBeenCalled()
})
