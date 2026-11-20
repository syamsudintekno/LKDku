// tokens.js - Token gerak & animasi (AGENTS.md §8)

export const DUR = {
  instant: 0.1,
  fast: 0.18,
  base: 0.28,
  slow: 0.45,
}

export const SPRING = {
  snappy: { type: 'spring', stiffness: 520, damping: 32 },
  bouncy: { type: 'spring', stiffness: 380, damping: 18 },
}

export const EASE = [0.22, 1, 0.36, 1]

export const PRESS = { scale: 0.96 }

export const HOVER_LIFT = { y: -2, scale: 1.02 }

export const HOLD_MS = 1000

export const STAGGER = { list: 0.04, maxDelay: 0.2 }
export const OFFSET = { list: 8 }
export const BADGE_SWING = [-8, 6, -3, 0]
export const REPORT_MOTION = { offset: 12 }
export const CONFETTI = {
  particleCount: 70,
  spread: 65,
  ticks: 70,
  originY: 0.65,
  durationMs: 1400,
}
