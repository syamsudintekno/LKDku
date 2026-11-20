import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { CBadge } from '@coreui/react'
import FunButton from '../../components/ui/FunButton'
import DoneCheck from '../../components/ui/DoneCheck'
import IncidentalBadge from '../../components/ui/IncidentalBadge'
import { APP_ICONS } from '../../components/ui/icons'
import { activityDescription } from '../../domain/activity'

const ActivityRow = ({
  row,
  skpCode,
  readOnly,
  busy,
  onToggle,
  onEdit,
  onCancel,
  onDelete,
  conflicts,
}) => (
  <article
    className={`activity-row ${row.status === 'terealisasi' && !row.optimistic ? 'activity-realized' : ''}`}
    aria-label={`Kegiatan ${row.nomor}: ${row.deskripsi}`}
  >
    <div className="d-flex gap-3 align-items-start">
      <DoneCheck
        label={`Terealisasi: ${row.deskripsi}`}
        pending={!!row.optimistic}
        checked={row.status === 'terealisasi'}
        disabled={readOnly || busy || row.optimistic || row.status === 'dibatalkan'}
        onChange={() => onToggle(row)}
      />
      <div className="flex-grow-1 min-width-0">
        <p
          className={`fw-semibold mb-2 text-break ${row.status === 'dibatalkan' ? 'text-decoration-line-through' : ''}`}
        >
          {row.nomor}. {activityDescription(row)}
        </p>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <span className={`chip-unsur ${row.unsur.toLowerCase()}`}>{row.unsur}</span>
          <CBadge
            color={
              row.status === 'terealisasi'
                ? 'success'
                : row.status === 'rencana'
                  ? 'info'
                  : 'secondary'
            }
          >
            {row.status === 'terealisasi'
              ? 'Terealisasi'
              : row.status === 'rencana'
                ? 'Rencana'
                : 'Dibatalkan'}
          </CBadge>
          {row.sumber === 'insidental' && <IncidentalBadge confirmed={!row.optimistic} />}
          {row.sumber === 'skp' && (
            <Link to="/skp" className="small" aria-label={`Buka SKP ${skpCode || 'terkait'}`}>
              SKP {skpCode || 'terkait'}
            </Link>
          )}
          <span className="small">
            {row.jumlah} {row.satuan}
          </span>
          {row.optimistic && (
            <span className="small" role="status">
              Menyimpan...
            </span>
          )}
        </div>
        {row.sumber === 'insidental' && (
          <p className="small text-body-secondary mb-2">Alasan: {row.alasan_insidental}</p>
        )}
        {conflicts > 0 && (
          <p className="small text-warning-emphasis mb-2">
            Bentrok jam dengan {conflicts} kegiatan. Periksa jadwal.
          </p>
        )}
        {!readOnly && (
          <div className="d-flex flex-wrap gap-2">
            <FunButton
              variant="ghost"
              icon={APP_ICONS.ubah}
              disabled={busy || row.optimistic}
              onClick={() => onEdit(row)}
            >
              Ubah / pindah
            </FunButton>
            <FunButton
              variant="ghost"
              icon={APP_ICONS.ulang}
              disabled={busy || row.optimistic}
              onClick={() => onCancel(row)}
            >
              {row.status === 'dibatalkan' ? 'Kembalikan rencana' : 'Batalkan'}
            </FunButton>
            <FunButton
              variant="ghost"
              color="danger"
              icon={APP_ICONS.hapus}
              disabled={busy || row.optimistic}
              onClick={() => onDelete(row)}
            >
              Hapus
            </FunButton>
          </div>
        )}
      </div>
    </div>
  </article>
)
ActivityRow.propTypes = {
  row: PropTypes.object.isRequired,
  skpCode: PropTypes.string,
  readOnly: PropTypes.bool,
  busy: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  conflicts: PropTypes.number.isRequired,
}
export default ActivityRow
