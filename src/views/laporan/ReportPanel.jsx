import React from 'react'
import PropTypes from 'prop-types'
import { motion } from 'motion/react'
import { useMotionPref } from '../../motion/useMotionPref'
import { DUR, EASE, REPORT_MOTION } from '../../motion/tokens'

const ReportPanel = ({ tab, children }) => {
  const { mode } = useMotionPref()
  const props = {
    role: 'tabpanel',
    id: `report-panel-${tab}`,
    'aria-labelledby': `report-tab-${tab}`,
  }
  return mode === 'mati' ? (
    <div {...props}>{children}</div>
  ) : (
    <motion.div
      key={tab}
      {...props}
      initial={{ opacity: 0, x: mode === 'ceria' ? REPORT_MOTION.offset : 0 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: DUR.fast, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
ReportPanel.propTypes = { tab: PropTypes.string.isRequired, children: PropTypes.node }
export default ReportPanel
