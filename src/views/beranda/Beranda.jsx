import React from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CCard, CCardBody } from '@coreui/react'
import { useMe } from '../../api/auth'

const Beranda = () => {
  const { data } = useMe()
  const profile = data?.profile || {}
  return (
    <>
      <h1 className="h3 mb-2">Selamat datang{profile.nama ? `, ${profile.nama}` : ''}</h1>
      <p className="text-body-secondary mb-4">
        Susun laporan kinerja dari rencana dan kegiatan Anda.
      </p>
      <CCard className="shadow-sm mb-4">
        <CCardBody>
          <h2 className="h5">Profil pegawai</h2>
          {profile.nama ? (
            <dl className="row mb-0">
              <dt className="col-sm-3">Nama</dt>
              <dd className="col-sm-9">{profile.nama}</dd>
              <dt className="col-sm-3">NIP</dt>
              <dd className="col-sm-9">{profile.nip || 'Belum diisi'}</dd>
              <dt className="col-sm-3">Unit kerja</dt>
              <dd className="col-sm-9">{profile.unit_kerja || 'Belum diisi'}</dd>
            </dl>
          ) : (
            <p className="mb-0">Profil belum diisi. Lengkapi profil melalui Pengaturan.</p>
          )}
        </CCardBody>
      </CCard>
      <CAlert color="info">
        Catat kegiatan melalui Pencatatan Harian atau buat draft dari template SKP. Periksa dan
        finalisasi hasilnya melalui Laporan Bulanan.
      </CAlert>
      <div className="d-flex flex-wrap gap-2">
        <Link to="/harian" className="btn btn-primary">
          Buka pencatatan harian
        </Link>
        <Link to="/pengaturan" className="btn btn-outline-primary">
          Buka pengaturan
        </Link>
      </div>
    </>
  )
}
export default Beranda
