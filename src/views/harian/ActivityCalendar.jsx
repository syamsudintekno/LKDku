import React from 'react'
import PropTypes from 'prop-types'
import CIcon from '@coreui/icons-react'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import { formatTableDate } from '../../domain/dateId'

const ActivityCalendar = ({ days, selected, onSelect }) => {
  const leading = (days[0].weekday + 6) % 7
  return (
    <>
      <div className="activity-calendar" role="group" aria-label="Kalender kegiatan bulanan">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((name) => (
          <span className="calendar-weekday" key={name}>
            {name}
          </span>
        ))}
        {Array.from({ length: leading }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {days.map((day) => (
          <FunButton
            key={day.tanggal}
            announce={false}
            variant={selected === day.tanggal ? 'primary' : 'ghost'}
            className={`calendar-day ${day.complete ? 'calendar-complete' : ''}`}
            aria-pressed={selected === day.tanggal}
            aria-label={`${formatTableDate(day.tanggal)}: ${day.realized} dari ${day.total} terealisasi${day.incidental ? `, ${day.incidental} insidental` : ''}${day.kind === 'holiday' ? ', Libur Umum' : day.kind === 'empty' ? ', hari kerja kosong' : ''}${day.warnings.includes('Bentrok jam') ? ', bentrok jam' : ''}`}
            onClick={() => onSelect(day.tanggal)}
          >
            <span>{Number(day.tanggal.slice(-2))}</span>
            <small>
              {day.total ? (
                `${day.realized}/${day.total}`
              ) : day.kind === 'holiday' ? (
                <CIcon icon={APP_ICONS.libur} aria-hidden="true" size="sm" />
              ) : (
                '—'
              )}
            </small>
            {(day.incidental > 0 || day.warnings.includes('Bentrok jam')) && (
              <span className="calendar-markers" aria-hidden="true">
                {day.incidental > 0 && <CIcon icon={APP_ICONS.insidental} size="sm" />}
                {day.warnings.includes('Bentrok jam') && (
                  <CIcon icon={APP_ICONS.warning} size="sm" />
                )}
              </span>
            )}
          </FunButton>
        ))}
      </div>
      <p className="small text-body-secondary mt-3 mb-0">
        Angka: terealisasi/total. Matahari: Libur Umum. Petir: insidental. Segitiga: bentrok jam.
        Tanda —: hari kerja kosong. Ketuk tanggal untuk melihat kegiatan.
      </p>
    </>
  )
}
ActivityCalendar.propTypes = {
  days: PropTypes.array.isRequired,
  selected: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
}
export default ActivityCalendar
