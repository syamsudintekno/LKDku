import React from 'react'
import { CCard, CCardBody, CBadge } from '@coreui/react'

const Harian = () => (
  <CCard className="border-0 shadow-sm p-4">
    <CCardBody>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Pencatatan Harian</h4>
        <CBadge color="info">Milestone M2</CBadge>
      </div>
      <p className="text-body-secondary">
        Modul pencatatan kegiatan harian, checklist cepat terealisasi, dan input insidental akan
        diaktifkan pada Milestone M2.
      </p>
    </CCardBody>
  </CCard>
)

export default Harian
