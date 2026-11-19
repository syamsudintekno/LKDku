import React from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CRow, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilCheckCircle,
  cilTask,
  cilDescription,
  cilCloudDownload,
  cilArrowRight,
} from '@coreui/icons'
import { motion } from 'motion/react'
import { FunButton } from '../../components/ui/FunButton'
import { useMe } from '../../api/auth'

const Beranda = () => {
  const { data: authData } = useMe()
  const profile = authData?.profile || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard
            className="border-0 shadow-sm"
            style={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1f5f5b 0%, #277a74 100%)',
              color: '#fff',
            }}
          >
            <CCardBody className="p-4">
              <div className="d-md-flex align-items-center justify-content-between">
                <div>
                  <CBadge color="light" textBgColor="light" className="mb-2 text-dark px-2 py-1">
                    Laporan Kinerja Bulanan Dosen
                  </CBadge>
                  <h3 className="fw-bold mb-1">
                    Selamat Datang, {profile.nama || 'Ahmad Syamsudin, M.Kom.'}
                  </h3>
                  <p className="mb-0 text-white-50">
                    NIP: {profile.nip || '198809022015031004'} ·{' '}
                    {profile.unit_kerja || 'FTIK / Tadris Matematika'}
                  </p>
                </div>
                <div className="mt-3 mt-md-0">
                  <FunButton
                    variant="primary"
                    color="light"
                    className="text-primary fw-bold px-3 py-2"
                    icon={cilTask}
                    onClick={() => {}}
                  >
                    + Kegiatan Hari Ini
                  </FunButton>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
            <CCardBody>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-body-secondary small fw-semibold">Bulan Berjalan</span>
                <div
                  className="p-2 rounded-circle"
                  style={{ backgroundColor: 'rgba(31, 95, 91, 0.1)', color: '#1f5f5b' }}
                >
                  <CIcon icon={cilSpeedometer} />
                </div>
              </div>
              <h4 className="fw-bold mb-1">November 2026</h4>
              <p className="text-body-secondary small mb-0">
                Status: <CBadge color="warning">Draft Aktif</CBadge>
              </p>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
            <CCardBody>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-body-secondary small fw-semibold">Terealisasi</span>
                <div
                  className="p-2 rounded-circle"
                  style={{ backgroundColor: 'rgba(21, 128, 61, 0.1)', color: '#15803d' }}
                >
                  <CIcon icon={cilCheckCircle} />
                </div>
              </div>
              <h4 className="fw-bold mb-1 text-success">28 Kegiatan</h4>
              <p className="text-body-secondary small mb-0">67% hari kerja terisi</p>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
            <CCardBody>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-body-secondary small fw-semibold">Rencana Tersisa</span>
                <div
                  className="p-2 rounded-circle"
                  style={{ backgroundColor: 'rgba(29, 78, 216, 0.1)', color: '#1d4ed8' }}
                >
                  <CIcon icon={cilTask} />
                </div>
              </div>
              <h4 className="fw-bold mb-1 text-info">14 Kegiatan</h4>
              <p className="text-body-secondary small mb-0">Otomatis dari template SKP</p>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
            <CCardBody>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-body-secondary small fw-semibold">PDF Siap Cetak</span>
                <div
                  className="p-2 rounded-circle"
                  style={{ backgroundColor: 'rgba(180, 83, 9, 0.1)', color: '#b45309' }}
                >
                  <CIcon icon={cilCloudDownload} />
                </div>
              </div>
              <h4 className="fw-bold mb-1">Okt 2026</h4>
              <p className="text-body-secondary small mb-0">
                <CBadge color="success">Terkunci / Final</CBadge>
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3">
        <CCol lg={8}>
          <CCard className="border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <CCardHeader className="bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Status Sistem & Arsitektur M0</h5>
              <CBadge color="success">Fondasi Siap</CBadge>
            </CCardHeader>
            <CCardBody>
              <p className="text-body-secondary small mb-3">
                Milestone M0 memverifikasi koneksi antara frontend React (CoreUI Free) di GitHub
                Pages dengan backend Google Apps Script dan Google Sheets.
              </p>
              <ul className="list-group list-group-flush small">
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span>
                    Spreadsheet Database (ID: <code>1Wv84...</code>)
                  </span>
                  <CBadge color="success">Terhubung</CBadge>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span>
                    Folder Hasil Ekspor PDF (ID: <code>1mol1...</code>)
                  </span>
                  <CBadge color="success">Siap</CBadge>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span>
                    Apps Script Project (ID: <code>1E-UO...</code>)
                  </span>
                  <CBadge color="info">Script_LKD</CBadge>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span>Sesi Autentikasi Pengguna</span>
                  <CBadge color="primary">Aktif</CBadge>
                </li>
              </ul>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard className="border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <CCardHeader className="bg-transparent border-0 pt-3 pb-0">
              <h5 className="fw-bold mb-0">Menu Cepat</h5>
            </CCardHeader>
            <CCardBody>
              <div className="d-grid gap-2">
                <FunButton
                  variant="ghost"
                  className="justify-content-between text-start"
                  icon={cilTask}
                >
                  <span>Pencatatan Harian</span>
                  <CIcon icon={cilArrowRight} />
                </FunButton>
                <FunButton
                  variant="ghost"
                  className="justify-content-between text-start"
                  icon={cilDescription}
                >
                  <span>Laporan Bulanan</span>
                  <CIcon icon={cilArrowRight} />
                </FunButton>
                <FunButton
                  variant="ghost"
                  className="justify-content-between text-start"
                  icon={cilSpeedometer}
                >
                  <span>Manajemen SKP</span>
                  <CIcon icon={cilArrowRight} />
                </FunButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </motion.div>
  )
}

export default Beranda
