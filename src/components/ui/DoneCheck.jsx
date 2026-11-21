import React from 'react'
import PropTypes from 'prop-types'
import { CSpinner } from '@coreui/react'
import { motion } from 'motion/react'
import { useMotionPref } from '../../motion/useMotionPref'
import { DUR, EASE, PRESS, SPRING } from '../../motion/tokens'

const DoneCheck = ({ label, checked, pending = false, disabled = false, onChange }) => {
  const { mode } = useMotionPref()
  const confirmed = checked && !pending
  const circle = {
    cx: 12,
    cy: 12,
    r: 10,
    fill: confirmed ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
  }
  const tick = {
    d: 'M6 12l4 4 8-8',
    fill: 'none',
    stroke: 'white',
    strokeWidth: 2.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  return (
    <label className={`done-check ${confirmed ? 'done-check-confirmed' : ''}`}>
      <input
        type="checkbox"
        className="done-check-input"
        aria-label={label}
        aria-busy={pending}
        checked={checked}
        disabled={disabled || pending}
        onChange={onChange}
      />
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
        {mode === 'ceria' ? (
          <motion.circle
            key={confirmed ? 'done' : 'open'}
            {...circle}
            initial={confirmed ? { scale: PRESS.scale } : false}
            animate={{ scale: 1 }}
            transition={SPRING.bouncy}
            style={{ transformOrigin: 'center' }}
          />
        ) : (
          <circle {...circle} />
        )}
        {confirmed &&
          (mode === 'ceria' ? (
            <motion.path
              {...tick}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: DUR.base, ease: EASE }}
            />
          ) : (
            <path {...tick} />
          ))}
      </svg>
      {pending && <CSpinner className="done-check-spinner" size="sm" aria-hidden="true" />}
    </label>
  )
}
DoneCheck.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  pending: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
}
export default DoneCheck
