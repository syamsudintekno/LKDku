import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CCard,
  CCardBody,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import FunButton from './FunButton'
import { APP_ICONS } from './icons'
import { useReferenceMutation } from '../../api/reference'

const ReferenceList = ({
  rows,
  columns,
  action,
  onEdit,
  onSelect,
  readOnly = false,
  empty = 'Belum ada data. Tambahkan data pertama.',
}) => {
  const [deleting, setDeleting] = useState(null)
  const restore = useReferenceMutation(`${action}.restore`)
  const remove = useReferenceMutation(`${action}.delete`, {
    onSaved: () => setDeleting(null),
    undo: (data) => restore.mutate({ ...data.record, related: data.related }),
  })
  const actions = (row) => (
    <div className="d-flex flex-wrap gap-2">
      {onSelect && (
        <FunButton
          variant="ghost"
          icon={APP_ICONS.calendar}
          onClick={() => onSelect(row)}
          disabled={row.optimistic}
        >
          Template
        </FunButton>
      )}
      {!readOnly && (
        <FunButton
          variant="ghost"
          icon={APP_ICONS.ubah}
          onClick={() => onEdit(row)}
          disabled={row.optimistic}
        >
          Ubah
        </FunButton>
      )}
      {!readOnly && (
        <FunButton
          variant="ghost"
          color="danger"
          icon={APP_ICONS.hapus}
          onClick={() => setDeleting(row)}
          disabled={row.optimistic}
        >
          Hapus
        </FunButton>
      )}
      {row.optimistic && (
        <span className="small text-body-secondary align-self-center" role="status">
          Menunggu server...
        </span>
      )}
    </div>
  )
  if (!rows.length) return <CAlert color="info">{empty}</CAlert>
  return (
    <>
      <div className="d-none d-md-block">
        <CTable responsive hover align="middle">
          <CTableHead>
            <CTableRow>
              {columns.map((column) => (
                <CTableHeaderCell key={column.key} scope="col">
                  {column.label}
                </CTableHeaderCell>
              ))}
              <CTableHeaderCell scope="col">Aksi</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {rows.map((row) => (
              <CTableRow key={row.id}>
                {columns.map((column) => (
                  <CTableDataCell key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </CTableDataCell>
                ))}
                <CTableDataCell>{actions(row)}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </div>
      <div className="d-md-none d-grid gap-3">
        {rows.map((row) => (
          <CCard key={row.id}>
            <CCardBody>
              <dl className="mb-2">
                {columns.map((column) => (
                  <React.Fragment key={column.key}>
                    <dt>{column.label}</dt>
                    <dd>{column.render ? column.render(row) : row[column.key]}</dd>
                  </React.Fragment>
                ))}
              </dl>
              {actions(row)}
            </CCardBody>
          </CCard>
        ))}
      </div>
      {deleting && (
        <CModal
          visible
          onClose={() => !remove.isPending && setDeleting(null)}
          aria-labelledby="delete-reference-title"
        >
          <CModalHeader>
            <CModalTitle id="delete-reference-title">Hapus data ini?</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p>Data dihapus sementara. Kegiatan yang sudah tercatat tetap utuh.</p>
            {action === 'skp.item' && <p>Template di bawah butir ini juga dinonaktifkan.</p>}
            {remove.error && (
              <CAlert color="danger" role="alert">
                {remove.error.message}
              </CAlert>
            )}
          </CModalBody>
          <CModalFooter>
            <FunButton
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => setDeleting(null)}
            >
              Batal
            </FunButton>
            <FunButton
              variant="danger-hold"
              icon={APP_ICONS.hapus}
              loading={remove.isPending}
              onHoldComplete={() => remove.mutate(deleting)}
            >
              Tahan untuk hapus
            </FunButton>
          </CModalFooter>
        </CModal>
      )}
    </>
  )
}
ReferenceList.propTypes = {
  rows: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  action: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  readOnly: PropTypes.bool,
  empty: PropTypes.string,
}
export default ReferenceList
