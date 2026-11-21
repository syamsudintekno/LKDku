import React from 'react'
import PropTypes from 'prop-types'
import CIcon from '@coreui/icons-react'
import { motion } from 'motion/react'
import { useMotionPref } from '../../motion/useMotionPref'
import { BADGE_SWING, DUR, EASE } from '../../motion/tokens'
import { APP_ICONS } from './icons'

const IncidentalBadge = ({ confirmed = true }) => {
  const { mode } = useMotionPref()
  const content = (
    <>
      <CIcon icon={APP_ICONS.insidental} aria-hidden="true" className="me-1" />
      Insidental
    </>
  )
  return mode === 'ceria' && confirmed ? (
    <motion.span
      className="badge-insidental"
      initial={{ rotate: BADGE_SWING[0] }}
      animate={{ rotate: BADGE_SWING }}
      transition={{ duration: DUR.slow, ease: EASE }}
    >
      {content}
    </motion.span>
  ) : (
    <span className="badge-insidental">{content}</span>
  )
}
IncidentalBadge.propTypes = { confirmed: PropTypes.bool }
export default IncidentalBadge
