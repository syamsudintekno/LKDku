import React from 'react'
import { CCard, CCardBody, CBadge } from '@coreui/react'

const Pengaturan = () => (
  <CCard className="border-0 shadow-sm p-4">
    <CCardBody>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Pengaturan Sistem</h4>
        <CBadge color="success">Aktif Sebagian (M0)</CBadge>
      </div>
      <p className="text-body-secondary">
        Pengaturan profil dosen, kop surat kementerian, daftar hari libur, unsur/satuan, dan
        manajemen kata sandi.
      </p>
    </CCardBody>
  </CCard>
)

export default Pengaturan
