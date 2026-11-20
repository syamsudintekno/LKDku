import { DUR, EASE, OFFSET, PRESS, STAGGER } from './tokens'

export function activityRowMotion(index, mode) {
  if (mode === 'mati') return {}
  return {
    initial: { opacity: 0, y: mode === 'ceria' ? OFFSET.list : 0 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DUR.fast,
        ease: EASE,
        delay: mode === 'ceria' ? Math.min(index * STAGGER.list, STAGGER.maxDelay) : 0,
      },
    },
    exit: {
      opacity: 0,
      scale: mode === 'ceria' ? PRESS.scale : 1,
      transition: { duration: DUR.fast, ease: EASE },
    },
  }
}
