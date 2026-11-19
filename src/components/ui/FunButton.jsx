import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { motion } from 'motion/react'
import { PRESS, HOVER_LIFT } from '../../motion/tokens'

/**
 * FunButton - Pembungkus CButton CoreUI dengan micro-interactions dan feedback visual
 */
export const FunButton = ({
  variant = 'primary',
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
  const [holdProgress, setHoldProgress] = useState(0)
  const holdIntervalRef = useRef(null)

  const isHold = variant === 'danger-hold'

  const handleMouseDown = (e) => {
    if (!isHold || disabled || loading) return

    setHoldProgress(0)
    const startTime = Date.now()
    const duration = 1000 // 1 detik tekan-tahan

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, (elapsed / duration) * 100)
      setHoldProgress(progress)

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current)
        holdIntervalRef.current = null
        if (onHoldComplete) {
          onHoldComplete(e)
        }
      }
    }, 20)
  }

  const handleMouseUp = () => {
    if (!isHold) return
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    setHoldProgress(0)
  }

  // Tentukan warna CoreUI
  let coreUiColor = color
  let coreUiVariant = undefined

  if (!color) {
    if (variant === 'primary') coreUiColor = 'primary'
    else if (variant === 'success') coreUiColor = 'success'
    else if (variant === 'ghost') {
      coreUiColor = 'secondary'
      coreUiVariant = 'ghost'
    } else if (variant === 'danger' || variant === 'danger-hold') {
      coreUiColor = 'danger'
    } else {
      coreUiColor = 'primary'
    }
  }

  return (
    <motion.div
      whileHover={disabled || loading ? {} : HOVER_LIFT}
      whileTap={disabled || loading ? {} : PRESS}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      <CButton
        color={coreUiColor}
        variant={coreUiVariant}
        size={size}
        disabled={disabled || loading}
        className={`fun-btn ${className} ${isHold ? 'position-relative overflow-hidden' : ''}`}
        onClick={isHold ? undefined : onClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        {...props}
      >
        {isHold && holdProgress > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${holdProgress}%`,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              transition: 'width 20ms linear',
              pointerEvents: 'none',
            }}
          />
        )}

        {loading ? (
          <>
            <CSpinner size="sm" aria-hidden="true" className="me-1" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            {icon && <CIcon icon={icon} className="me-1" aria-hidden="true" />}
            {children}
          </>
        )}
      </CButton>
    </motion.div>
  )
}

FunButton.propTypes = {
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
}

export default FunButton
