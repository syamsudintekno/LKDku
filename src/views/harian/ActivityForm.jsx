import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CForm,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import ReferenceFields from '../../components/ui/ReferenceFields'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import { useActivityMonth, useActivityMutation } from '../../api/activity'
import { findTimeConflicts, validateActivity } from '../../domain/activity'
import { isIsoDate } from '../../domain/templateSchedule'

export function emptyActivity(tanggal) {
  return {
    tanggal,
    deskripsi: '',
    unsur: '',
    jumlah: 1,
    satuan: '',
    jam_mulai: '',
    jam_selesai: '',
    skp_item_id: '',
    template_id: '',
    sumber: 'skp',
    alasan_insidental: '',
    status: 'rencana',
    bukti_url: '',
    catatan: '',
  }
}
const ActivityForm = ({ initial, references, records, onClose, onSaved }) => {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const differentMonth =
    isIsoDate(draft.tanggal) && draft.tanggal.slice(0, 7) !== initial.tanggal.slice(0, 7)
  const target = useActivityMonth(
    isIsoDate(draft.tanggal) ? draft.tanggal.slice(0, 7) : initial.tanggal.slice(0, 7),
    differentMonth,
  )
  const targetFinal = differentMonth && target.data?.final
  const addAgain = useRef(false)
  const form = useRef(null)
  const mutation = useActivityMutation('activity.upsert', {
    onSaved: (result) => onSaved(result.record, addAgain.current),
  })
  const years = new Set(
    references.years
      .filter(
        (row) =>
          row.deleted != 1 &&
          row.status === 'aktif' &&
          Number(row.tahun) === Number(draft.tanggal.slice(0, 4)),
      )
      .map((row) => row.id),
  )
  const items = references.items.filter(
    (row) =>
      (row.deleted != 1 && Number(row.aktif) === 1 && years.has(row.skp_year_id)) ||
      (initial.id && row.id === initial.skp_item_id),
  )
  const templates = references.templates.filter(
    (row) =>
      row.skp_item_id === draft.skp_item_id && (row.deleted != 1 || row.id === initial.template_id),
  )
  const choices = (values) => [
    { value: '', label: 'Pilih...' },
    ...values.map((value) => ({ value, label: value })),
  ]
  const fixed = !!initial.generated_key
  const fields = [
    {
      name: 'tanggal',
      label: 'Tanggal kegiatan',
      type: 'date',
      required: true,
      min: '1900-01-01',
      max: '2200-12-31',
    },
    {
      name: 'sumber',
      label: 'Sumber kegiatan',
      required: true,
      disabled: fixed,
      options: [
        { value: 'skp', label: 'Dari SKP' },
        { value: 'insidental', label: 'Insidental' },
      ],
    },
    ...(draft.sumber === 'skp'
      ? [
          {
            name: 'skp_item_id',
            label: 'Butir SKP',
            required: true,
            disabled: fixed,
            options: [
              { value: '', label: 'Pilih butir SKP aktif...' },
              ...items.map((row) => ({
                value: row.id,
                label: `${row.kode} · ${row.rencana_hasil_kerja || 'Butir terkait sebelumnya'}`,
              })),
            ],
          },
          {
            name: 'template_id',
            label: 'Template (opsional)',
            disabled: fixed,
            options: [
              { value: '', label: 'Tanpa template' },
              ...templates.map((row) => ({ value: row.id, label: row.deskripsi })),
            ],
          },
        ]
      : [
          {
            name: 'alasan_insidental',
            label: 'Alasan insidental',
            required: true,
            multiline: true,
            wide: true,
          },
        ]),
    {
      name: 'deskripsi',
      label: 'Deskripsi kegiatan',
      required: true,
      multiline: true,
      wide: true,
      maxLength: 2000,
    },
    {
      name: 'unsur',
      label: 'Unsur',
      required: true,
      options: choices(references.config.unsur_list || []),
    },
    {
      name: 'jumlah',
      label: 'Jumlah',
      type: 'number',
      required: true,
      min: 0,
      max: 1000000000,
      step: 'any',
    },
    {
      name: 'satuan',
      label: 'Satuan',
      required: true,
      options: choices(references.config.satuan_list || []),
    },
    {
      name: 'status',
      label: 'Status kegiatan',
      required: true,
      options: [
        { value: 'rencana', label: 'Rencana' },
        { value: 'terealisasi', label: 'Terealisasi' },
        { value: 'dibatalkan', label: 'Dibatalkan' },
      ],
    },
    { name: 'jam_mulai', label: 'Jam mulai (opsional)', type: 'time' },
    { name: 'jam_selesai', label: 'Jam selesai (opsional)', type: 'time' },
    {
      name: 'bukti_url',
      label: 'Tautan bukti (opsional)',
      type: 'url',
      wide: true,
      maxLength: 2000,
    },
    { name: 'catatan', label: 'Catatan (opsional)', wide: true, multiline: true, maxLength: 2000 },
  ]
  const change = (value) => {
    let next = value
    if (value.sumber !== draft.sumber) next = { ...value, skp_item_id: '', template_id: '' }
    else if (value.skp_item_id !== draft.skp_item_id) {
      const item = items.find((row) => row.id === value.skp_item_id)
      next = {
        ...value,
        template_id: '',
        unsur: item?.unsur || '',
        satuan: item?.satuan_target || '',
      }
    } else if (value.template_id !== draft.template_id) {
      const template = templates.find((row) => row.id === value.template_id)
      if (template)
        next = {
          ...value,
          deskripsi: template.deskripsi,
          jumlah: template.jumlah,
          satuan: template.satuan,
          jam_mulai: template.jam_mulai,
          jam_selesai: template.jam_selesai,
        }
    }
    setDraft(next)
    setError('')
    mutation.reset()
  }
  const save = () => {
    try {
      if (targetFinal) throw new Error('Bulan tujuan sudah final. Pilih tanggal lain.')
      validateActivity(draft, references, initial.id ? initial : null)
      setError('')
      mutation.mutate({ ...draft, create: !initial.id })
    } catch (failure) {
      setError(failure.message)
    }
  }
  const conflicts = findTimeConflicts(draft, differentMonth ? target.data?.records || [] : records)
  return (
    <CModal
      visible
      size="lg"
      scrollable
      backdrop="static"
      className="activity-modal"
      onClose={() => !mutation.isPending && onClose()}
      aria-labelledby="activity-form-title"
    >
      <CModalHeader closeButton={!mutation.isPending}>
        <CModalTitle id="activity-form-title">
          {initial.id ? 'Ubah atau pindah kegiatan' : 'Tambah kegiatan'}
        </CModalTitle>
      </CModalHeader>
      <CForm
        ref={form}
        className="reference-modal-form"
        onSubmit={(event) => {
          event.preventDefault()
          addAgain.current = false
          save()
        }}
      >
        <CModalBody>
          {(error || mutation.error) && (
            <CAlert color="danger" role="alert">
              {error || mutation.error.message}
            </CAlert>
          )}
          {fixed && (
            <CAlert color="info">
              Kegiatan hasil generator tetap tertaut ke SKP dan template asal ketika disunting atau
              dipindahkan.
            </CAlert>
          )}
          {draft.sumber === 'insidental' && (
            <p>Kegiatan ini belum ada di SKP. Tulis alasan singkat agar mudah ditelusuri nanti.</p>
          )}
          {differentMonth && target.isPending && (
            <p role="status">Memeriksa jadwal bulan tujuan...</p>
          )}
          {differentMonth && target.isError && (
            <CAlert color="warning">
              Jadwal bulan tujuan belum dapat dimuat. Server tetap memeriksa bentrok saat menyimpan.
            </CAlert>
          )}
          {targetFinal && (
            <CAlert color="warning" role="alert">
              Bulan tujuan sudah final. Pilih tanggal lain sebelum menyimpan.
            </CAlert>
          )}
          <ReferenceFields
            fields={fields}
            value={draft}
            onChange={change}
            disabled={mutation.isPending}
          />
          {conflicts.length > 0 && (
            <CAlert color="warning" className="mt-3" role="status">
              Bentrok jam dengan {conflicts.length} kegiatan pada tanggal ini. Anda tetap dapat
              menyimpan setelah memeriksanya.
            </CAlert>
          )}
        </CModalBody>
        <CModalFooter>
          <FunButton variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Batal
          </FunButton>
          <FunButton
            type="submit"
            icon={APP_ICONS.simpan}
            disabled={!!targetFinal}
            loading={mutation.isPending}
            onClick={() => {
              addAgain.current = false
            }}
          >
            Simpan kegiatan
          </FunButton>
          {!initial.id && (
            <FunButton
              variant="ghost"
              icon={APP_ICONS.tambah}
              disabled={mutation.isPending || !!targetFinal}
              onClick={() => {
                if (form.current.reportValidity()) {
                  addAgain.current = true
                  save()
                }
              }}
            >
              Simpan dan tambah lagi
            </FunButton>
          )}
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
ActivityForm.propTypes = {
  initial: PropTypes.object.isRequired,
  references: PropTypes.object.isRequired,
  records: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}
export default ActivityForm
