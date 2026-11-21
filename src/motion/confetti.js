import { CONFETTI } from './tokens'
export const celebrateAchievement = (mode) => celebrateReport(mode)

export function celebrateReport(mode) {
  let cancelled = false,
    timer,
    confetti,
    media
  const cancel = () => {
    cancelled = true
    clearTimeout(timer)
    confetti?.reset()
    media?.removeEventListener('change', cancel)
  }
  if (mode !== 'ceria' || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return cancel
  import('canvas-confetti')
    .then((module) => {
      if (
        cancelled ||
        document.documentElement.dataset.motion !== 'ceria' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return
      confetti = module.default
      media = window.matchMedia('(prefers-reduced-motion: reduce)')
      media.addEventListener('change', cancel)
      confetti({
        particleCount: CONFETTI.particleCount,
        spread: CONFETTI.spread,
        ticks: CONFETTI.ticks,
        origin: { y: CONFETTI.originY },
        disableForReducedMotion: true,
      })
      timer = setTimeout(cancel, CONFETTI.durationMs)
    })
    .catch(() => {
      /* Celebration failure must not change a saved report. */
    })
  return cancel
}
