import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CCard, CCardBody, CForm, CFormInput } from '@coreui/react'
import ReferenceFields from '../../components/ui/ReferenceFields'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import { useReferenceMutation } from '../../api/reference'

const fields = [
  { name: 'nama', label: 'Nama dan gelar' },
  { name: 'nip', label: 'NIP', maxLength: 18 },
  { name: 'jabatan', label: 'Jabatan dan pangkat' },
  { name: 'unit_kerja', label: 'Unit kerja' },
  { name: 'satuan_kerja', label: 'Satuan kerja', wide: true },
  { name: 'kop_1', label: 'Kop baris pertama', wide: true },
  { name: 'kop_2', label: 'Kop baris kedua', wide: true },
  { name: 'kop_3', label: 'Kop baris ketiga', wide: true },
  { name: 'alamat_kop', label: 'Alamat dan kontak kop', wide: true, multiline: true },
  { name: 'kota_ttd', label: 'Kota penandatanganan' },
  { name: 'atasan_nama', label: 'Nama pejabat yang mengetahui' },
  { name: 'atasan_nip', label: 'NIP pejabat', maxLength: 18 },
  { name: 'atasan_jabatan', label: 'Jabatan pejabat' },
  {
    name: 'folder_pdf_id',
    label: 'ID folder Drive untuk PDF',
    wide: true,
    help: 'Isi ID folder milik sendiri. Pembuatan PDF tersedia pada tahap laporan.',
  },
]
const ProfileForm = ({ data }) => {
  const [draft, setDraft] = useState({ ...data.profile })
  const [version, setVersion] = useState(data.profileVersion)
  const [logoError, setLogoError] = useState('')
  const mutation = useReferenceMutation('profile.update', {
    onSaved: (saved) => {
      setDraft(saved.profile)
      setVersion(saved.version)
    },
  })
  const changed = (value) => {
    setDraft(value)
    mutation.reset()
  }
  return (
    <CForm
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate({ profile: draft, version })
      }}
    >
      <h2 className="h5 mb-3">Profil dan kop laporan</h2>
      <p className="text-body-secondary">
        Profil boleh dilengkapi bertahap. NIP yang diisi harus berjumlah 18 angka.
      </p>
      {mutation.error && (
        <CAlert color="danger" role="alert">
          {mutation.error.message}
        </CAlert>
      )}
      <ReferenceFields
        fields={fields}
        value={draft}
        onChange={changed}
        disabled={mutation.isPending}
      />
      <CFormInput
        id="profile-logo"
        type="file"
        accept="image/png,image/jpeg"
        label="Logo kop (PNG/JPEG, maksimal 14 KB)"
        className="mt-3"
        disabled={mutation.isPending}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 14000) {
            setLogoError('Pilih PNG/JPEG maksimal 14 KB.')
            event.target.value = ''
            return
          }
          const reader = new FileReader()
          reader.onload = () => {
            setDraft((previous) => ({ ...previous, logo_kop: reader.result }))
            mutation.reset()
            setLogoError('')
          }
          reader.onerror = () => setLogoError('Logo belum dapat dibaca. Pilih ulang berkas.')
          reader.readAsDataURL(file)
        }}
      />
      {logoError && (
        <p role="alert" className="text-danger">
          {logoError}
        </p>
      )}
      {draft.logo_kop && (
        <div className="mt-2">
          <img
            src={draft.logo_kop}
            alt="Logo kop laporan"
            style={{ maxWidth: 80, maxHeight: 80 }}
          />
          <FunButton
            variant="ghost"
            onClick={() => changed({ ...draft, logo_kop: '' })}
            disabled={mutation.isPending}
          >
            Hapus logo dari profil
          </FunButton>
        </div>
      )}
      <CCard className="mt-4">
        <CCardBody>
          <h3 className="h6">Pratinjau teks kop</h3>
          <div className="text-center border-top pt-3" aria-label="Pratinjau teks kop">
            {[draft.kop_1, draft.kop_2, draft.kop_3].map((line, index) => (
              <div className={index < 2 ? 'fw-bold' : 'small'} key={index}>
                {line || '—'}
              </div>
            ))}
            <div className="small text-break">{draft.alamat_kop}</div>
          </div>
        </CCardBody>
      </CCard>
      <div className="d-flex flex-wrap gap-2 mt-4">
        <FunButton
          type="submit"
          icon={APP_ICONS.simpan}
          loading={mutation.isPending}
          success={mutation.isSuccess}
        >
          Simpan profil
        </FunButton>
        <FunButton
          variant="ghost"
          icon={APP_ICONS.ulang}
          disabled={mutation.isPending}
          onClick={() => {
            setDraft({ ...data.profile })
            setVersion(data.profileVersion)
            mutation.reset()
          }}
        >
          Muat ulang profil
        </FunButton>
      </div>
    </CForm>
  )
}
ProfileForm.propTypes = { data: PropTypes.object.isRequired }
export default ProfileForm
