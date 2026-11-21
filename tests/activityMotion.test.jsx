import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DoneCheck from '../src/components/ui/DoneCheck'
import { MotionProvider } from '../src/motion/useMotionPref'
import ActivityList from '../src/views/harian/ActivityList'
import IncidentalBadge from '../src/components/ui/IncidentalBadge'

it('Mode Mati mempertahankan checkbox fungsional dengan centang statis setelah konfirmasi server', () => {
  localStorage.setItem('lkb-motion-mode', 'mati')
  const change = vi.fn()
  const { container, rerender } = render(
    <MotionProvider>
      <DoneCheck label="Kegiatan uji" checked pending onChange={change} />
    </MotionProvider>,
  )
  expect(screen.getByRole('checkbox')).toBeDisabled()
  expect(container.querySelector('path')).toBeNull()
  rerender(
    <MotionProvider>
      <DoneCheck label="Kegiatan uji" checked onChange={change} />
    </MotionProvider>,
  )
  expect(container.querySelector('path')).not.toBeNull()
  expect(container.querySelector('path').getAttribute('stroke-dasharray')).toBeNull()
  fireEvent.click(screen.getByRole('checkbox'))
  expect(change).toHaveBeenCalledTimes(1)
})
it('reduced-motion menampilkan 40 kegiatan dan badge insidental tanpa style gerak', () => {
  vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({
    matches: true,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  const rows = Array.from({ length: 40 }, (_, index) => ({ id: String(index) }))
  const { container } = render(
    <MotionProvider>
      <ActivityList rows={rows} renderRow={(row) => <span>Kegiatan uji {row.id}</span>} />
      <IncidentalBadge confirmed />
    </MotionProvider>,
  )
  expect(screen.getAllByText(/Kegiatan uji/)).toHaveLength(40)
  expect(screen.getByText('Insidental')).toBeInTheDocument()
  expect(container.querySelector('[style*="transform"]')).toBeNull()
  expect(document.documentElement.dataset.motion).toBe('mati')
})
