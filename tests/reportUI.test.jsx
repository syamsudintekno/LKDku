import React from 'react'
import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReportDocument from '../src/views/laporan/ReportDocument'
import { buildReport } from '../src/domain/report'
import fixture from './fixtures/activity.json'

it('preview escapes text and marks planned/incidental activities without adding them to final', () => {
  const input = {
    month: '2026-10',
    profile: { nama: 'Pegawai Uji' },
    records: [
      {
        ...fixture.activity,
        deskripsi: '<img src=x onerror=alert(1)>',
        sumber: 'insidental',
        skp_item_id: '',
        alasan_insidental: 'Uji',
      },
    ],
  }
  const { container, rerender } = render(
    <ReportDocument report={buildReport({ ...input, includePlans: true })} final={false} />,
  )
  expect(screen.getByText('Belum terealisasi')).toBeInTheDocument()
  expect(screen.getByText('Insidental')).toBeInTheDocument()
  expect(container.querySelector('img')).toBeNull()
  rerender(<ReportDocument report={buildReport(input)} final />)
  expect(screen.queryByText('Belum terealisasi')).toBeNull()
  expect(screen.queryByText('Insidental')).toBeNull()
})
