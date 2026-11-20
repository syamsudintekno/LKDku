import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { FeedbackProvider } from '../src/components/ui/FeedbackProvider'
import { MotionProvider } from '../src/motion/useMotionPref'
import Harian from '../src/views/harian/Harian'
import ActivityForm from '../src/views/harian/ActivityForm'
import DraftGenerator from '../src/views/harian/DraftGenerator'
import { generateDraftPlan } from '../src/domain/plan'
import { currentJakartaDate } from '../src/domain/dateId'
import fixture from './fixtures/activity.json'

vi.mock('../src/config', () => ({ API_URL: 'https://example.test/api' }))
const response = (data) => ({ ok: true, json: async () => ({ ok: true, data }) })
const open = (element, data) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  if (data) client.setQueryData(['activities', data.month], data)
  render(
    <QueryClientProvider client={client}>
      <MotionProvider>
        <MemoryRouter>
          <FeedbackProvider>{element}</FeedbackProvider>
        </MemoryRouter>
      </MotionProvider>
    </QueryClientProvider>,
  )
  return client
}
const currentData = (patch = {}) => {
  const today = currentJakartaDate()
  const year = Number(today.slice(0, 4))
  return {
    month: today.slice(0, 7),
    records: [
      {
        ...fixture.activity,
        tanggal: today,
        id: 'activity-test',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: 'version-test',
      },
    ],
    holidays: [],
    final: false,
    references: { ...fixture, years: [{ ...fixture.years[0], tahun: year }] },
    ...patch,
  }
}
it('centang memakai mutasi dan rollback ketika simpan gagal', async () => {
  const data = currentData()
  let rejectMutation
  vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
    const body = JSON.parse(options.body)
    return body.action === 'activity.list'
      ? Promise.resolve(response(data))
      : new Promise((resolve, reject) => {
          rejectMutation = reject
        })
  })
  const cache = open(<Harian />, data)
  const check = screen.getByRole('checkbox', { name: `Terealisasi: ${fixture.activity.deskripsi}` })
  fireEvent.click(check)
  await waitFor(() =>
    expect(cache.getQueryData(['activities', data.month]).records[0].status).toBe('terealisasi'),
  )
  await waitFor(() => expect(check).toBeDisabled())
  await act(async () => rejectMutation(new Error('offline')))
  await waitFor(() => expect(check).not.toBeChecked())
  expect(cache.getQueryData(['activities', data.month]).records[0].status).toBe('rencana')
})
it('form insidental mewajibkan alasan sebelum mengirim dan tetap memakai status rencana', async () => {
  const saved = vi.fn()
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
    const body = JSON.parse(options.body)
    return Promise.resolve(
      response({ record: { ...body.payload, id: 'test-created' }, conflicts: [] }),
    )
  })
  open(
    <ActivityForm
      initial={{ ...fixture.activity }}
      references={fixture}
      records={[]}
      onClose={() => {}}
      onSaved={saved}
    />,
  )
  fireEvent.change(screen.getByLabelText('Sumber kegiatan'), { target: { value: 'insidental' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Simpan kegiatan' }).closest('form'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Alasan insidental wajib diisi')
  expect(fetch).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Alasan insidental'), {
    target: { value: 'Undangan palsu untuk pengujian' },
  })
  fireEvent.submit(screen.getByRole('button', { name: 'Simpan kegiatan' }).closest('form'))
  await waitFor(() => expect(saved).toHaveBeenCalled())
  const payload = JSON.parse(fetch.mock.calls[0][1].body).payload
  expect(payload).toMatchObject({
    sumber: 'insidental',
    skp_item_id: '',
    template_id: '',
    status: 'rencana',
    create: true,
  })
})
it('generator memerlukan pratinjau dan mengirim versi tanpa mempercayai kandidat klien', async () => {
  const plan = generateDraftPlan({ ...fixture, holidays: [], activities: [] })
  const close = vi.fn()
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
    const { payload } = JSON.parse(options.body)
    return Promise.resolve(
      response(
        payload.dryRun
          ? { ...plan, previewVersion: 'test-preview' }
          : { records: [], created: 8, skipped: 0 },
      ),
    )
  })
  open(<DraftGenerator month="2026-10" onClose={close} />)
  expect(screen.getByRole('button', { name: 'Simpan draft rencana' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Periksa draft' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Simpan draft rencana' })).toBeEnabled(),
  )
  expect(fetch).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Simpan draft rencana' }))
  await waitFor(() => expect(close).toHaveBeenCalled())
  expect(JSON.parse(fetch.mock.calls[1][1].body).payload).toEqual({
    month: '2026-10',
    dryRun: false,
    previewVersion: 'test-preview',
  })
})
it('bulan final menampilkan hanya-baca dan kegiatan rencana tidak ditandai otomatis', () => {
  open(<Harian />, currentData({ final: true }))
  expect(screen.getByRole('button', { name: 'Tambah kegiatan' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Buat draft bulan ini' })).toBeDisabled()
  expect(screen.getByRole('checkbox')).toBeDisabled()
  expect(screen.getByRole('checkbox')).not.toBeChecked()
})

it('pratinjau bentrok memuat kegiatan bulan tujuan ketika tanggal dipindahkan', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    response({
      month: '2026-11',
      records: [{ ...fixture.activity, id: 'other-test', tanggal: '2026-11-01' }],
      final: false,
    }),
  )
  open(
    <ActivityForm
      initial={{ ...fixture.activity }}
      references={fixture}
      records={[]}
      onClose={() => {}}
      onSaved={() => {}}
    />,
  )
  fireEvent.change(screen.getByLabelText('Tanggal kegiatan'), { target: { value: '2026-11-01' } })
  expect(await screen.findByText(/Bentrok jam dengan 1 kegiatan/)).toBeInTheDocument()
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    action: 'activity.list',
    payload: { month: '2026-11' },
  })
})
