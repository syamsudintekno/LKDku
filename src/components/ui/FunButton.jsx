import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { motion } from 'motion/react'
import { DUR, EASE, PRESS, HOVER_LIFT, HOLD_MS } from '../../motion/tokens'
import { useMotionPref } from '../../motion/useMotionPref'

export const FunButton = ({
  variant = 'primary',
  announce = true,
  color,
  loading = false,
  success = false,
  icon,
  children,
  onClick,
  onHoldComplete,
  disabled = false,
  className = '',
  size,
  ...props
}) => {
  const { mode, enabled } = useMotionPref()
  const [progress, setProgress] = useState(0)
  const interval = useRef(null)
  const holding = useRef(false)
  const isHold = variant === 'danger-hold'
  const blocked = disabled || loading || success

  const cancelHold = useCallback(() => {
    clearInterval(interval.current)
    interval.current = null
    holding.current = false
    setProgress(0)
  }, [])

  useEffect(() => {
    if (blocked) {
      clearInterval(interval.current)
      interval.current = null
      holding.current = false
    }
    window.addEventListener('blur', cancelHold)
    return () => {
      clearInterval(interval.current)
      window.removeEventListener('blur', cancelHold)
    }
  }, [blocked, cancelHold])

  const startHold = (event) => {
    if (!isHold || blocked || holding.current) return
    holding.current = true
    setProgress(0)
    const started = Date.now()
    interval.current = setInterval(() => {
      const value = Math.min(1, (Date.now() - started) / HOLD_MS)
      setProgress(value)
      if (value === 1) {
        clearInterval(interval.current)
        interval.current = null
        onHoldComplete?.(event)
      }
    }, DUR.instant * 1000)
  }

  const colorName =
    color || (variant.startsWith('danger') ? 'danger' : variant === 'ghost' ? 'secondary' : variant)
  return (
    <motion.span
      className="fun-button-shell"
      tabIndex={-1}
      whileHover={!blocked && mode === 'ceria' ? HOVER_LIFT : undefined}
      whileTap={!blocked && mode === 'ceria' ? PRESS : undefined}
      transition={{ duration: enabled ? DUR.fast : 0, ease: EASE }}
    >
      <CButton
        {...props}
        type={props.type || 'button'}
        color={colorName}
        variant={variant === 'ghost' ? 'ghost' : undefined}
        size={size}
        disabled={blocked}
        aria-busy={loading}
        aria-label={
          isHold
            ? props['aria-label'] || (typeof children === 'string' ? children : undefined)
            : props['aria-label']
        }
        aria-description={isHold ? 'Tahan selama satu detik untuk melanjutkan.' : undefined}
        className={`fun-btn ${className}`}
        onClick={isHold ? (event) => event.preventDefault() : onClick}
        onPointerDown={(event) => {
          if (event.button === 0) startHold(event)
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
        onBlur={cancelHold}
        onKeyDown={(event) => {
          if (isHold && [' ', 'Enter'].includes(event.key)) {
            event.preventDefault()
            if (!event.repeat) startHold(event)
          }
        }}
        onKeyUp={(event) => {
          if (isHold && [' ', 'Enter'].includes(event.key)) {
            event.preventDefault()
            cancelHold()
          }
        }}
      >
        {isHold && (
          <svg
            className="hold-ring"
            viewBox="0 0 24 24"
            role="progressbar"
            aria-label="Progres tekan-tahan"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((blocked ? 0 : progress) * 100)}
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              opacity="0.25"
              strokeWidth="2"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              pathLength="1"
              strokeDasharray={`${blocked ? 0 : progress} 1`}
              transform="rotate(-90 12 12)"
            />
          </svg>
        )}
        {loading ? (
          <CSpinner size="sm" aria-hidden="true" />
        ) : success ? (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <motion.path
              d="M5 12l4 4L19 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              initial={enabled ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: enabled ? DUR.base : 0, ease: EASE }}
            />
          </svg>
        ) : (
          icon && <CIcon icon={icon} aria-hidden="true" />
        )}
        <span aria-live={announce ? 'polite' : undefined}>
          {loading ? 'Memproses...' : success ? 'Tersimpan' : children}
        </span>
      </CButton>
    </motion.span>
  )
}

FunButton.propTypes = {
  announce: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'success', 'ghost', 'danger', 'danger-hold']),
  color: PropTypes.string,
  loading: PropTypes.bool,
  success: PropTypes.bool,
  icon: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
  children: PropTypes.node,
  onClick: PropTypes.func,
  onHoldComplete: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.string,
  type: PropTypes.string,
}
export default FunButton
