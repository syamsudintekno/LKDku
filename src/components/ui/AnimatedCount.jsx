import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { motion, useSpring, useTransform } from 'motion/react'
import { useMotionPref } from '../../motion/useMotionPref'
import { SPRING } from '../../motion/tokens'
const AnimatedCount = ({ value }) => {
  const { mode } = useMotionPref(),
    spring = useSpring(0, SPRING.snappy),
    rounded = useTransform(spring, (value) => String(Math.round(value)))
  useEffect(() => {
    if (mode === 'ceria') spring.set(value)
    else spring.jump(value)
  }, [value, mode, spring])
  return mode === 'ceria' ? (
    <span>
      <span className="visually-hidden">{value}</span>
      <motion.span aria-hidden="true">{rounded}</motion.span>
    </span>
  ) : (
    <span>{value}</span>
  )
}
AnimatedCount.propTypes = { value: PropTypes.number.isRequired }
export default AnimatedCount
