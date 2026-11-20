import React from 'react'
import { CAlert, CCard, CCardBody, CFormSelect } from '@coreui/react'
import { useMotionPref } from '../../motion/useMotionPref'

const Pengaturan = () => {
  const { savedMode, setMode, reduced } = useMotionPref()
  return (
    <CCard className="shadow-sm">
      <CCardBody>
        <h1 className="h4 mb-3">Pengaturan</h1>
        <CFormSelect
          id="motion-mode"
          label="Mode animasi"
          value={savedMode}
          onChange={(event) => setMode(event.target.value)}
          options={[
            { value: 'ceria', label: 'Ceria' },
            { value: 'tenang', label: 'Tenang' },
            { value: 'mati', label: 'Mati' },
          ]}
        />
        <p className="small text-body-secondary mt-2">Pilihan disimpan di perangkat ini.</p>
        {reduced && (
          <CAlert color="info">Pengaturan perangkat mengurangi gerakan. Animasi dimatikan.</CAlert>
        )}
        <p className="mb-0">
          Pengelolaan profil, SKP, dan hari libur tersedia pada tahap berikutnya.
        </p>
      </CCardBody>
    </CCard>
  )
}
export default Pengaturan
