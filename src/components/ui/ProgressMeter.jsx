import React from 'react'
import PropTypes from 'prop-types'
import { motion } from 'motion/react'
import { useMotionPref } from '../../motion/useMotionPref'
import { SPRING, DUR, EASE } from '../../motion/tokens'
const ProgressMeter = ({ value, max = 100, label }) => {
  const { mode } = useMotionPref(),
    ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0))
  return (
    <div className="dashboard-meter">
      <progress className="visually-hidden" max={max || 1} value={value} aria-label={label} />
      {mode === 'mati' ? (
        <span className="dashboard-meter-fill" style={{ transform: `scaleX(${ratio})` }} />
      ) : (
        <motion.span
          className="dashboard-meter-fill"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: ratio }}
          transition={mode === 'ceria' ? SPRING.snappy : { duration: DUR.fast, ease: EASE }}
        />
      )}
    </div>
  )
}
ProgressMeter.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  label: PropTypes.string.isRequired,
}
export default ProgressMeter
