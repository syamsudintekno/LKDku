import React from 'react'
import { CCard, CCardBody, CBadge } from '@coreui/react'

const Skp = () => (
  <CCard className="border-0 shadow-sm p-4">
    <CCardBody>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Rencana SKP & Template Kegiatan</h4>
        <CBadge color="info">Milestone M1</CBadge>
      </div>
      <p className="text-body-secondary">
        Modul penyusunan SKP tahunan, butir kerja, indikator, target capaian, dan template jadwal
        kegiatan berulang akan diaktifkan pada Milestone M1.
      </p>
    </CCardBody>
  </CCard>
)

export default Skp
