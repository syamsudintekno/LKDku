import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MotionProvider } from '../src/motion/useMotionPref'
import ProgressMeter from '../src/components/ui/ProgressMeter'
import AnimatedCount from '../src/components/ui/AnimatedCount'
it('reduced-motion keeps progress accessible and counts final without motion', () => {
  vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({
    matches: true,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  const { container } = render(
    <MotionProvider>
      <ProgressMeter label="Capaian uji" value={125} />
      <AnimatedCount value={7} />
    </MotionProvider>,
  )
  expect(screen.getByRole('progressbar', { name: 'Capaian uji' })).toHaveAttribute('value', '125')
  expect(screen.getByText('7')).toBeInTheDocument()
  expect(container.querySelector('.dashboard-meter-fill').style.transform).toBe('scaleX(1)')
  expect(document.documentElement.dataset.motion).toBe('mati')
})
