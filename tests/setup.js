import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

if (typeof window !== 'undefined')
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
afterEach(() => {
  cleanup()
  if (typeof window !== 'undefined') {
    sessionStorage.clear()
    localStorage.clear()
  }
  vi.restoreAllMocks()
})
