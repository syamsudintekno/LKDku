import React from 'react'
import PropTypes from 'prop-types'
import { AnimatePresence, motion } from 'motion/react'
import { useMotionPref } from '../../motion/useMotionPref'
import { activityRowMotion } from '../../motion/variants'

const ActivityList = ({ rows, renderRow }) => {
  const { mode } = useMotionPref()
  if (mode === 'mati')
    return (
      <div className="activity-list">
        {rows.map((row) => (
          <div key={row.id}>{renderRow(row)}</div>
        ))}
      </div>
    )
  return (
    <div className="activity-list">
      <AnimatePresence>
        {rows.map((row, index) => (
          <motion.div key={row.id} {...activityRowMotion(index, mode)}>
            {renderRow(row)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
ActivityList.propTypes = { rows: PropTypes.array.isRequired, renderRow: PropTypes.func.isRequired }
export default ActivityList
