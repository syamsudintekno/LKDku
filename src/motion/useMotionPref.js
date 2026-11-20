import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import PropTypes from 'prop-types'
import { MotionConfig } from 'motion/react'
import { DUR } from './tokens'

const MotionContext = createContext({ mode: 'ceria', enabled: true, setMode: () => {} })
const query = '(prefers-reduced-motion: reduce)'
const getReduced = () => window.matchMedia(query).matches
const subscribeReduced = (listener) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export const MotionProvider = ({ children }) => {
  const [savedMode, setMode] = useState(() => {
    const saved = localStorage.getItem('lkb-motion-mode')
    return ['ceria', 'tenang', 'mati'].includes(saved) ? saved : 'ceria'
  })
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => true)
  const mode = reduced ? 'mati' : savedMode
  useEffect(() => {
    localStorage.setItem('lkb-motion-mode', savedMode)
    document.documentElement.dataset.motion = mode
    document.documentElement.style.setProperty('--motion-base', `${DUR.base}s`)
  }, [savedMode, mode])

  return React.createElement(
    MotionContext.Provider,
    { value: { mode, savedMode, reduced, enabled: mode !== 'mati', setMode } },
    React.createElement(
      MotionConfig,
      { reducedMotion: mode === 'mati' ? 'always' : 'user' },
      children,
    ),
  )
}
MotionProvider.propTypes = { children: PropTypes.node.isRequired }
export const useMotionPref = () => useContext(MotionContext)
