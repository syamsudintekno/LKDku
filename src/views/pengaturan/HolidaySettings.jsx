import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CForm, CFormTextarea } from '@coreui/react'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import ReferenceList from '../../components/ui/ReferenceList'
import ReferenceModal from '../../components/ui/ReferenceModal'
import { useReferenceMutation } from '../../api/reference'
import { formatTableDate } from '../../domain/dateId'

const kinds = [
  { value: 'nasional', label: 'Libur nasional' },
  { value: 'cuti_bersama', label: 'Cuti bersama' },
  { value: 'kampus', label: 'Libur kampus' },
]
const HolidaySettings = ({ data }) => {
  const [editing, setEditing] = useState(null)
  const [source, setSource] = useState('')
  const [localError, setLocalError] = useState('')
  const mutation = useReferenceMutation('holiday.import', { onSaved: () => setSource('') })
  const fields = [
    {
      name: 'tanggal',
      label: 'Tanggal libur',
      type: 'date',
      required: true,
      min: `${data.tahun}-01-01`,
      max: `${data.tahun}-12-31`,
    },
    { name: 'jenis', label: 'Jenis libur', options: kinds, required: true },
    { name: 'keterangan', label: 'Keterangan libur', required: true, wide: true, maxLength: 500 },
  ]
  const submitImport = (event) => {
    event.preventDefault()
    try {
      const rows = JSON.parse(source)
      if (!Array.isArray(rows) || !rows.length || rows.length > 400)
        throw new Error('Isi daftar JSON dengan 1 sampai 400 baris.')
      setLocalError('')
      mutation.mutate({ tahun: data.tahun, rows })
    } catch (error) {
      setLocalError(
        error instanceof SyntaxError
          ? 'Format JSON belum valid. Periksa kurung dan tanda kutip.'
          : error.message,
      )
    }
  }
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <h2 className="h5">Hari libur {data.tahun}</h2>
        <FunButton
          icon={APP_ICONS.tambah}
          onClick={() => setEditing({ jenis: 'kampus', tanggal: '', keterangan: '' })}
        >
          Tambah hari libur
        </FunButton>
      </div>
      <p className="text-body-secondary">
        Sabtu dan Minggu dikenali otomatis. Daftar ini untuk libur nasional, cuti bersama, dan libur
        kampus.
      </p>
      <ReferenceList
        rows={[...data.holidays].sort((a, b) => a.tanggal.localeCompare(b.tanggal))}
        action="holiday"
        onEdit={setEditing}
        columns={[
          { key: 'tanggal', label: 'Tanggal', render: (row) => formatTableDate(row.tanggal) },
          { key: 'keterangan', label: 'Keterangan' },
          {
            key: 'jenis',
            label: 'Jenis',
            render: (row) => kinds.find((kind) => kind.value === row.jenis)?.label || row.jenis,
          },
        ]}
        empty="Belum ada libur tambahan pada tahun ini."
      />
      {editing && (
        <ReferenceModal
          title="Hari libur"
          fields={fields}
          initial={editing}
          action="holiday.upsert"
          onClose={() => setEditing(null)}
        />
      )}
      <CForm onSubmit={submitImport} className="mt-4 border-top pt-4">
        <h3 className="h6">Impor daftar libur dari JSON</h3>
        <p className="small text-body-secondary">
          Setiap baris memuat tanggal (yyyy-MM-dd), keterangan, dan jenis (nasional, cuti_bersama,
          atau kampus). Tanggal harus berada pada tahun pilihan. Tanggal yang sudah ada dilewati.
        </p>
        <CFormTextarea
          id="holiday-import"
          label="Daftar JSON hari libur"
          value={source}
          onChange={(event) => {
            setSource(event.target.value)
            setLocalError('')
          }}
          rows={5}
          required
          disabled={mutation.isPending}
        />
        {(localError || mutation.error) && (
          <CAlert color="danger" role="alert" className="mt-2">
            {localError || mutation.error.message}
          </CAlert>
        )}
        <FunButton
          type="submit"
          icon={APP_ICONS.download}
          loading={mutation.isPending}
          className="mt-3"
        >
          Impor libur {data.tahun}
        </FunButton>
      </CForm>
    </>
  )
}
HolidaySettings.propTypes = { data: PropTypes.object.isRequired }
export default HolidaySettings
