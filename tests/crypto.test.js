import { describe, it, expect } from 'vitest'
import { constantTimeCompare } from '../src/domain/crypto'

describe('Domain Crypto & Security', () => {
  it('berhasil membandingkan string yang identik', () => {
    expect(constantTimeCompare('secret123', 'secret123')).toBe(true)
  })

  it('menolak string yang berbeda panjang atau isi', () => {
    expect(constantTimeCompare('secret123', 'secret124')).toBe(false)
    expect(constantTimeCompare('secret123', 'secret12')).toBe(false)
    expect(constantTimeCompare('short', 'longer_string')).toBe(false)
  })

  it('menolak input non-string secara aman', () => {
    expect(constantTimeCompare(null, 'secret')).toBe(false)
    expect(constantTimeCompare(undefined, undefined)).toBe(false)
    expect(constantTimeCompare(123, 123)).toBe(false)
  })
})
