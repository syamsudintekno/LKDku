import React from 'react'
import { CCard, CCardBody, CBadge } from '@coreui/react'

const Laporan = () => (
  <CCard className="border-0 shadow-sm p-4">
    <CCardBody>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Laporan Bulanan & Ekspor PDF</h4>
        <CBadge color="info">Milestone M3</CBadge>
      </div>
      <p className="text-body-secondary">
        Modul pratinjau tabel LKB, pemeriksaan aturan format (BR-01 s.d. BR-13), finalisasi
        terkunci, dan generate PDF otomatis ke Google Drive akan diaktifkan pada Milestone M3.
      </p>
    </CCardBody>
  </CCard>
)

export default Laporan
