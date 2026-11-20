import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import FunButton from '../src/components/ui/FunButton'
import { MotionProvider, useMotionPref } from '../src/motion/useMotionPref'

const wrap = (button) => <MotionProvider>{button}</MotionProvider>
afterEach(() => vi.useRealTimers())
describe('FunButton', () => {
  it('menampilkan proses dan sukses serta mencegah klik ganda', () => {
    const click = vi.fn()
    const { rerender } = render(
      wrap(
        <FunButton loading onClick={click}>
          Simpan
        </FunButton>,
      ),
    )
    expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button'))
    expect(click).not.toHaveBeenCalled()
    rerender(
      wrap(
        <FunButton success onClick={click}>
          Simpan
        </FunButton>,
      ),
    )
    expect(screen.getByRole('button', { name: 'Tersimpan' })).toBeDisabled()
    rerender(wrap(<FunButton onClick={click}>Simpan</FunButton>))
    fireEvent.click(screen.getByRole('button'))
    expect(click).toHaveBeenCalledTimes(1)
  })
  it('membatalkan tahan singkat dan menjalankan aksi keyboard tepat sekali setelah 1 detik', () => {
    vi.useFakeTimers()
    const complete = vi.fn()
    render(
      wrap(
        <FunButton variant="danger-hold" onHoldComplete={complete}>
          Finalisasi
        </FunButton>,
      ),
    )
    const button = screen.getByRole('button', { name: 'Finalisasi' })
    fireEvent.keyDown(button, { key: ' ' })
    act(() => vi.advanceTimersByTime(900))
    fireEvent.keyUp(button, { key: ' ' })
    expect(complete).not.toHaveBeenCalled()
    fireEvent.keyDown(button, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(1000))
    expect(complete).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(button, { key: 'Enter', repeat: true })
    act(() => vi.advanceTimersByTime(2000))
    expect(complete).toHaveBeenCalledTimes(1)
  })
  it('mendukung pointer dan membatalkan tahan saat pointer dibatalkan', () => {
    vi.useFakeTimers()
    const complete = vi.fn()
    render(
      wrap(
        <FunButton variant="danger-hold" onHoldComplete={complete}>
          Kunci
        </FunButton>,
      ),
    )
    const button = screen.getByRole('button', { name: 'Kunci' })
    fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
    act(() => vi.advanceTimersByTime(900))
    fireEvent.pointerCancel(button)
    act(() => vi.advanceTimersByTime(500))
    expect(complete).not.toHaveBeenCalled()
    fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
    act(() => vi.advanceTimersByTime(1000))
    expect(complete).toHaveBeenCalledTimes(1)
  })
  it('membersihkan timer ketika komponen dilepas', () => {
    vi.useFakeTimers()
    const complete = vi.fn()
    const { unmount } = render(
      wrap(
        <FunButton variant="danger-hold" onHoldComplete={complete}>
          Kunci
        </FunButton>,
      ),
    )
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    unmount()
    act(() => vi.advanceTimersByTime(2000))
    expect(complete).not.toHaveBeenCalled()
  })
})
const Preference = () => {
  const { mode, setMode } = useMotionPref()
  return <button onClick={() => setMode('mati')}>{mode}</button>
}
describe('Preferensi animasi', () => {
  it('menyimpan Mode Mati dan menonaktifkan CSS gerak', () => {
    render(wrap(<Preference />))
    fireEvent.click(screen.getByRole('button', { name: 'ceria' }))
    expect(screen.getByRole('button', { name: 'mati' })).toBeInTheDocument()
    expect(document.documentElement.dataset.motion).toBe('mati')
    expect(localStorage.getItem('lkb-motion-mode')).toBe('mati')
  })
  it('memaksa Mati saat perangkat meminta reduced-motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({
      matches: true,
      media,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    render(wrap(<Preference />))
    expect(screen.getByRole('button', { name: 'mati' })).toBeInTheDocument()
    expect(document.documentElement.dataset.motion).toBe('mati')
  })
})
