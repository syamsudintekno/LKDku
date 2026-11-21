import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CBadge, CFormInput } from '@coreui/react'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import { useTemplatePreview } from '../../api/reference'
import { formatTableDate } from '../../domain/dateId'
import { isIsoDate } from '../../domain/templateSchedule'

const TemplatePreview = ({ value, onChange }) => {
  const [month, setMonth] = useState(`${value.tgl_mulai.slice(0, 4)}-01`)
  const [exception, setException] = useState('')
  const preview = useTemplatePreview()
  let excluded = []
  try {
    excluded = JSON.parse(value.pengecualian || '[]')
  } catch {
    /* Server validates legacy data. */
  }
  const payload = { ...value, month }
  const fresh = JSON.stringify(preview.variables) === JSON.stringify(payload)
  return (
    <section className="mt-4 border-top pt-3" aria-label="Pengecualian dan pratinjau template">
      <h3 className="h6">Tanggal pengecualian</h3>
      <div className="d-flex flex-wrap align-items-end gap-2 mb-2">
        <CFormInput
          id="exception-date"
          label="Tanggal yang dilewati"
          type="date"
          value={exception}
          min={value.tgl_mulai}
          max={value.tgl_akhir}
          onChange={(event) => setException(event.target.value)}
        />
        <FunButton
          variant="ghost"
          icon={APP_ICONS.tambah}
          disabled={
            !isIsoDate(exception) || exception < value.tgl_mulai || exception > value.tgl_akhir
          }
          onClick={() => {
            onChange({
              ...value,
              pengecualian: JSON.stringify([...new Set([...excluded, exception])].sort()),
            })
            setException('')
          }}
        >
          Tambahkan pengecualian
        </FunButton>
      </div>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {excluded.map((date) => (
          <FunButton
            key={date}
            variant="ghost"
            icon={APP_ICONS.hapus}
            onClick={() =>
              onChange({
                ...value,
                pengecualian: JSON.stringify(excluded.filter((item) => item !== date)),
              })
            }
            aria-label={`Hapus pengecualian ${date}`}
          >
            {formatTableDate(date)}
          </FunButton>
        ))}
      </div>
      <p className="small text-body-secondary">
        Dua mingguan dihitung dari pekan Senin–Minggu yang memuat tanggal mulai. Bulanan mengikuti
        nomor tanggal mulai; bulan tanpa tanggal tersebut dilewati. Hari Minggu, libur, dan
        pengecualian dilewati. Sabtu hanya disertakan bila hari template dipilih Sabtu.
      </p>
      <CFormInput
        id="preview-month"
        label="Bulan pratinjau"
        type="month"
        min={`${value.tgl_mulai.slice(0, 4)}-01`}
        max={`${value.tgl_mulai.slice(0, 4)}-12`}
        value={month}
        onChange={(event) => setMonth(event.target.value)}
      />
      <FunButton
        className="mt-2"
        variant="ghost"
        icon={APP_ICONS.calendar}
        loading={preview.isPending}
        onClick={() => preview.mutate(payload)}
      >
        Pratinjau tanggal
      </FunButton>
      {fresh && preview.error && (
        <CAlert className="mt-3" color="danger" role="alert">
          {preview.error.message}
        </CAlert>
      )}
      {fresh && preview.data && (
        <div className="mt-3" aria-live="polite">
          <p className="fw-semibold">
            {preview.data.dates.length} tanggal pada {month}
          </p>
          <div className="d-flex flex-wrap gap-2">
            {preview.data.dates.map((date) => (
              <CBadge key={date} color="primary" className="p-2">
                {formatTableDate(date)}
              </CBadge>
            ))}
          </div>
          {!preview.data.dates.length && <p>Tidak ada jadwal yang cocok pada bulan ini.</p>}
        </div>
      )}
    </section>
  )
}
TemplatePreview.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}
export default TemplatePreview
