import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import FunButton from '../../components/ui/FunButton'
import { formatTableDate, HARI_INDONESIA } from '../../domain/dateId'
const WeekStrip = ({ days, selected, onSelect }) => {
  const strip = useRef(null)
  useEffect(() => {
    strip.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView?.({ behavior: 'instant', block: 'nearest', inline: 'center' })
  }, [selected])
  return (
    <div
      ref={strip}
      className="activity-week-strip"
      role="group"
      aria-label="Strip tanggal, geser untuk tanggal lain"
    >
      {days.map((day) => (
        <FunButton
          key={day.tanggal}
          announce={false}
          variant={selected === day.tanggal ? 'primary' : 'ghost'}
          aria-pressed={selected === day.tanggal}
          aria-label={`${formatTableDate(day.tanggal)}: ${day.realized}/${day.total} terealisasi${day.kind === 'holiday' ? ', Libur Umum' : ''}`}
          onClick={() => onSelect(day.tanggal)}
        >
          <span className="small">{HARI_INDONESIA[day.weekday].slice(0, 3)}</span>
          <strong>{Number(day.tanggal.slice(-2))}</strong>
          <small>
            {day.total ? `${day.realized}/${day.total}` : day.kind === 'holiday' ? 'Libur' : '—'}
          </small>
        </FunButton>
      ))}
    </div>
  )
}
WeekStrip.propTypes = {
  days: PropTypes.array.isRequired,
  selected: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
}
export default WeekStrip
