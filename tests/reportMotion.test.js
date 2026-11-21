import { it, expect, vi } from 'vitest'
import { celebrateReport } from '../src/motion/confetti'
import { CONFETTI } from '../src/motion/tokens'
const { confetti } = vi.hoisted(() => ({ confetti: Object.assign(vi.fn(), { reset: vi.fn() }) }))
vi.mock('canvas-confetti', () => ({ default: confetti }))
it('Mati, Tenang and reduced-motion never launch confetti', async () => {
  celebrateReport('mati')()
  celebrateReport('tenang')()
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })
  celebrateReport('ceria')()
  await Promise.resolve()
  expect(confetti).not.toHaveBeenCalled()
})
it('cancels delayed loading when the screen closes', async () => {
  document.documentElement.dataset.motion = 'ceria'
  const cancel = celebrateReport('ceria')
  cancel()
  await Promise.resolve()
  expect(confetti).not.toHaveBeenCalled()
})
it('Ceria launches one bounded celebration and resets it at the time limit', async () => {
  vi.useFakeTimers()
  try {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    document.documentElement.dataset.motion = 'ceria'
    const cancel = celebrateReport('ceria')
    await vi.dynamicImportSettled()
    expect(confetti).toHaveBeenCalledTimes(1)
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        disableForReducedMotion: true,
        particleCount: CONFETTI.particleCount,
      }),
    )
    vi.advanceTimersByTime(CONFETTI.durationMs)
    expect(confetti.reset).toHaveBeenCalledTimes(1)
    cancel()
  } finally {
    vi.useRealTimers()
  }
})
