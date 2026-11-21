import React, { useState } from 'react'
import { CAlert, CBadge, CCard, CCardBody, CFormSelect } from '@coreui/react'
import { useReferenceData } from '../../api/reference'
import { currentJakartaYear, formatTimeRange } from '../../domain/dateId'
import ReferenceState from '../../components/ui/ReferenceState'
import ReferenceModal from '../../components/ui/ReferenceModal'
import ReferenceList from '../../components/ui/ReferenceList'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import TemplatePreview from './TemplatePreview'

const statuses = { draft: 'Draft', aktif: 'Aktif', arsip: 'Arsip' }
const weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const Skp = () => {
  const currentYear = currentJakartaYear()
  const query = useReferenceData(currentYear)
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [editor, setEditor] = useState(null)
  const data = query.data
  const years = [...(data?.years || [])].sort(
    (a, b) =>
      Number(b.tahun) - Number(a.tahun) ||
      String(a.created_at || '').localeCompare(String(b.created_at || '')),
  )
  const year = years.find((row) => row.id === selectedYearId) || years[0]
  const items = (data?.items || []).filter((row) => row.skp_year_id === year?.id)
  const item = items.find((row) => row.id === selectedItemId) || items[0]
  const templates = (data?.templates || []).filter((row) => row.skp_item_id === item?.id)
  const archived = year?.status === 'arsip'
  const choices = (values) => [
    { value: '', label: 'Pilih...' },
    ...values.map((value) => ({ value, label: value })),
  ]
  const yearFields = [
    {
      name: 'tahun',
      label: 'Tahun SKP',
      type: 'number',
      min: 1900,
      max: 2200,
      required: true,
      disabled: !!editor?.value.id,
    },
    {
      name: 'status',
      label: 'Status SKP',
      required: true,
      options: (editor?.value.id
        ? editor.value.status === 'aktif'
          ? ['aktif', 'arsip']
          : ['draft', 'aktif', 'arsip']
        : ['draft']
      ).map((value) => ({ value, label: statuses[value] })),
    },
    { name: 'catatan', label: 'Catatan SKP', wide: true, multiline: true },
  ]
  const itemFields = [
    { name: 'kode', label: 'Kode butir', required: true, maxLength: 80 },
    {
      name: 'unsur',
      label: 'Unsur',
      required: true,
      options: choices(data?.config.unsur_list || []),
    },
    {
      name: 'rencana_hasil_kerja',
      label: 'Rencana hasil kerja',
      required: true,
      wide: true,
      multiline: true,
    },
    { name: 'indikator', label: 'Indikator', required: true, wide: true, multiline: true },
    {
      name: 'target_tahunan',
      label: 'Target tahunan',
      type: 'number',
      min: 0.000001,
      max: 1000000000,
      step: 'any',
      required: true,
    },
    {
      name: 'satuan_target',
      label: 'Satuan target',
      required: true,
      options: choices(data?.config.satuan_list || []),
    },
    {
      name: 'aktif',
      label: 'Status butir',
      options: [
        { value: 1, label: 'Aktif' },
        { value: 0, label: 'Tidak aktif' },
      ],
      required: true,
    },
    { name: 'catatan', label: 'Catatan butir', multiline: true, wide: true },
  ]
  const templateFields = [
    { name: 'deskripsi', label: 'Deskripsi template', required: true, wide: true, multiline: true },
    {
      name: 'hari',
      label: 'Hari template',
      required: true,
      options: weekdays.map((label, index) => ({ value: index + 1, label })),
    },
    {
      name: 'frekuensi',
      label: 'Frekuensi',
      required: true,
      options: [
        { value: 'mingguan', label: 'Mingguan' },
        { value: '2-mingguan', label: 'Dua mingguan' },
        { value: 'bulanan', label: 'Bulanan' },
        { value: 'sekali', label: 'Sekali' },
      ],
    },
    {
      name: 'tgl_mulai',
      label: 'Tanggal mulai',
      type: 'date',
      required: true,
      min: `${year?.tahun}-01-01`,
      max: `${year?.tahun}-12-31`,
    },
    {
      name: 'tgl_akhir',
      label: 'Tanggal akhir',
      type: 'date',
      required: true,
      min: `${year?.tahun}-01-01`,
      max: `${year?.tahun}-12-31`,
    },
    { name: 'jam_mulai', label: 'Jam mulai (opsional)', type: 'time' },
    { name: 'jam_selesai', label: 'Jam selesai (opsional)', type: 'time' },
    {
      name: 'jumlah',
      label: 'Jumlah',
      type: 'number',
      step: 'any',
      min: 0.000001,
      max: 1000000000,
      required: true,
    },
    {
      name: 'satuan',
      label: 'Satuan kegiatan',
      required: true,
      options: choices(data?.config.satuan_list || []),
    },
    {
      name: 'urutan',
      label: 'Urutan pada hari yang sama',
      type: 'number',
      min: 1,
      max: 10000,
      step: 1,
      required: true,
    },
  ]
  const openYear = () =>
    setEditor({ type: 'year', value: { tahun: currentYear, status: 'draft', catatan: '' } })
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <h1 className="h3">Rencana SKP</h1>
        <FunButton icon={APP_ICONS.tambah} onClick={openYear}>
          Buat SKP
        </FunButton>
      </div>
      <ReferenceState query={query}>
        {data && !years.length && (
          <CAlert color="info">
            Belum ada SKP. Buat SKP tahunan pertama untuk mulai menyusun butir kerja.
          </CAlert>
        )}
        {data && year && (
          <>
            <CCard className="shadow-sm mb-4">
              <CCardBody>
                <CFormSelect
                  id="selected-skp"
                  label="SKP yang ditampilkan"
                  value={year.id}
                  onChange={(event) => {
                    setSelectedYearId(event.target.value)
                    setSelectedItemId('')
                  }}
                  options={years.map((row) => ({
                    value: row.id,
                    label: `${row.tahun} · ${statuses[row.status]}${row.catatan ? ` · ${row.catatan.slice(0, 60)}` : ''}`,
                  }))}
                />
                <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                  <CBadge
                    color={archived ? 'secondary' : year.status === 'aktif' ? 'success' : 'info'}
                  >
                    {statuses[year.status]}
                  </CBadge>
                  <span>{items.length} butir kerja</span>
                  <FunButton
                    variant="ghost"
                    icon={APP_ICONS.ubah}
                    disabled={archived || year.optimistic}
                    onClick={() => setEditor({ type: 'year', value: year })}
                  >
                    Ubah status atau catatan
                  </FunButton>
                </div>
                {archived && (
                  <CAlert color="info" className="mt-3 mb-0">
                    SKP arsip hanya dapat dibaca. Buat SKP draft baru bila diperlukan.
                  </CAlert>
                )}
              </CCardBody>
            </CCard>
            <CCard className="shadow-sm mb-4">
              <CCardBody>
                <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                  <h2 className="h5">Butir SKP {year.tahun}</h2>
                  {!archived && (
                    <FunButton
                      icon={APP_ICONS.tambah}
                      disabled={year.optimistic}
                      onClick={() =>
                        setEditor({
                          type: 'item',
                          value: {
                            skp_year_id: year.id,
                            kode: '',
                            unsur: '',
                            rencana_hasil_kerja: '',
                            indikator: '',
                            target_tahunan: '',
                            satuan_target: '',
                            aktif: 1,
                            catatan: '',
                          },
                        })
                      }
                    >
                      Tambah butir
                    </FunButton>
                  )}
                </div>
                <ReferenceList
                  action="skp.item"
                  rows={items}
                  readOnly={archived}
                  onSelect={(row) => setSelectedItemId(row.id)}
                  onEdit={(row) => setEditor({ type: 'item', value: row })}
                  columns={[
                    { key: 'kode', label: 'Kode' },
                    { key: 'rencana_hasil_kerja', label: 'Rencana hasil kerja' },
                    { key: 'unsur', label: 'Unsur' },
                    {
                      key: 'target_tahunan',
                      label: 'Target',
                      render: (row) => `${row.target_tahunan} ${row.satuan_target}`,
                    },
                    {
                      key: 'aktif',
                      label: 'Status',
                      render: (row) => (Number(row.aktif) === 1 ? 'Aktif' : 'Tidak aktif'),
                    },
                  ]}
                  empty="Belum ada butir kerja pada SKP ini. Tambahkan rencana hasil kerja dan target tahunannya."
                />
              </CCardBody>
            </CCard>
            {item && (
              <CCard className="shadow-sm">
                <CCardBody>
                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                    <h2 className="h5">Template untuk {item.kode}</h2>
                    {!archived && (
                      <FunButton
                        icon={APP_ICONS.tambah}
                        disabled={item.optimistic}
                        onClick={() =>
                          setEditor({
                            type: 'template',
                            value: {
                              skp_item_id: item.id,
                              deskripsi: '',
                              hari: 1,
                              frekuensi: 'mingguan',
                              tgl_mulai: `${year.tahun}-01-01`,
                              tgl_akhir: `${year.tahun}-12-31`,
                              jam_mulai: '',
                              jam_selesai: '',
                              jumlah: 1,
                              satuan: item.satuan_target,
                              pengecualian: '[]',
                              urutan: 1,
                            },
                          })
                        }
                      >
                        Tambah template
                      </FunButton>
                    )}
                  </div>
                  <p className="text-body-secondary">{item.rencana_hasil_kerja}</p>
                  <ReferenceList
                    action="skp.template"
                    rows={templates}
                    readOnly={archived}
                    onEdit={(row) => setEditor({ type: 'template', value: row })}
                    columns={[
                      { key: 'deskripsi', label: 'Kegiatan' },
                      {
                        key: 'hari',
                        label: 'Jadwal',
                        render: (row) => `${weekdays[Number(row.hari) - 1]} · ${row.frekuensi}`,
                      },
                      {
                        key: 'jam_mulai',
                        label: 'Jam',
                        render: (row) =>
                          formatTimeRange(row.jam_mulai, row.jam_selesai) || 'Tanpa jam',
                      },
                      {
                        key: 'jumlah',
                        label: 'Jumlah',
                        render: (row) => `${row.jumlah} ${row.satuan}`,
                      },
                    ]}
                    empty="Belum ada template. Tambahkan jadwal, lalu periksa pratinjau tanggal sebelum menyimpan."
                  />
                </CCardBody>
              </CCard>
            )}
          </>
        )}
      </ReferenceState>
      {editor && (
        <ReferenceModal
          key={`${editor.type}-${editor.value.id || 'new'}`}
          title={
            editor.type === 'year'
              ? 'SKP tahunan'
              : editor.type === 'item'
                ? 'Butir SKP'
                : 'Template kegiatan'
          }
          action={`skp.${editor.type}.upsert`}
          fields={
            editor.type === 'year'
              ? yearFields
              : editor.type === 'item'
                ? itemFields
                : templateFields
          }
          initial={editor.value}
          onClose={() => setEditor(null)}
          onSaved={(saved) => {
            if (editor.type === 'year') setSelectedYearId(saved.id)
            if (editor.type === 'item') setSelectedItemId(saved.id)
          }}
        >
          {editor.type === 'template'
            ? (value, setValue) => <TemplatePreview value={value} onChange={setValue} />
            : undefined}
        </ReferenceModal>
      )}
    </>
  )
}
export default Skp
