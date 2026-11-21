import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CAlert,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
} from '@coreui/react'
import { useActivityMonth, useActivityMutation } from '../../api/activity'
import ReferenceState from '../../components/ui/ReferenceState'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import { generateUuid } from '../../api/client'
import { currentJakartaDate, formatTableDate } from '../../domain/dateId'
import { buildActivityDays, monthDates, plannedActivitiesForScope } from '../../domain/activityDays'
import { findTimeConflicts } from '../../domain/activity'
import { isIsoDate } from '../../domain/templateSchedule'
import ActivityCalendar from './ActivityCalendar'
import WeekStrip from './WeekStrip'
import ActivityRow from './ActivityRow'
import ActivityList from './ActivityList'
import ActivityForm, { emptyActivity } from './ActivityForm'
import DraftGenerator from './DraftGenerator'

const Harian = () => {
  const today = currentJakartaDate()
  const location = useLocation()
  const requested = new URLSearchParams(location.search).get('date')
  const initialDate = isIsoDate(requested) ? requested : today
  const [month, setMonth] = useState(initialDate.slice(0, 7))
  const [monthInput, setMonthInput] = useState(month)
  const [selected, setSelected] = useState(initialDate)
  const [editor, setEditor] = useState(null)
  const [generator, setGenerator] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const query = useActivityMonth(month)
  const data = query.data
  const days = useMemo(
    () => (data ? buildActivityDays(month, data.records, data.holidays) : []),
    [data, month],
  )
  const day = days.find((item) => item.tanggal === selected)
  const status = useActivityMutation('activity.bulkStatus')
  const restore = useActivityMutation('activity.restore')
  const remove = useActivityMutation('activity.delete', {
    onSaved: () => setDeleting(null),
    undo: (result) => restore.mutate(result.record),
  })
  const busy = status.isPending || remove.isPending || restore.isPending
  const setDate = (date) => {
    setSelected(date)
    setMonth(date.slice(0, 7))
    setMonthInput(date.slice(0, 7))
  }
  const openEditor = (row) =>
    setEditor({ key: generateUuid(), initial: row || emptyActivity(selected) })
  const changeStatus = (rows, next) =>
    status.mutate({ changes: rows.map(({ id, updated_at }) => ({ id, updated_at })), status: next })
  const targets = (scope) => plannedActivitiesForScope(data?.records || [], selected, scope)
  return (
    <div className="activity-page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0">Pencatatan Harian</h1>
        <div className="d-flex flex-wrap gap-2">
          <FunButton
            variant="ghost"
            icon={APP_ICONS.calendar}
            disabled={!data || data.final || busy}
            onClick={() => setGenerator(true)}
          >
            Buat draft bulan ini
          </FunButton>
          <FunButton
            icon={APP_ICONS.tambah}
            disabled={!data || data.final || busy}
            onClick={() => openEditor()}
          >
            Tambah kegiatan
          </FunButton>
        </div>
      </div>
      <CForm
        className="d-flex flex-wrap gap-2 align-items-end mb-3"
        onSubmit={(event) => {
          event.preventDefault()
          const dates = monthDates(monthInput)
          setDate(monthInput === today.slice(0, 7) ? today : dates[0])
        }}
      >
        <CFormInput
          id="activity-month"
          label="Bulan kegiatan"
          type="month"
          min="1900-01"
          max="2200-12"
          required
          value={monthInput}
          onChange={(event) => setMonthInput(event.target.value)}
        />
        <FunButton type="submit" variant="ghost" icon={APP_ICONS.calendar}>
          Tampilkan bulan
        </FunButton>
        <FunButton variant="ghost" icon={APP_ICONS.ulang} onClick={() => setDate(today)}>
          Hari ini
        </FunButton>
      </CForm>
      <ReferenceState query={query}>
        {data && day && (
          <>
            {data.final && (
              <CAlert color="info" role="status">
                Laporan bulan ini sudah final. Kegiatan hanya dapat dibaca sampai laporan dibuka
                kembali.
              </CAlert>
            )}
            <CRow className="g-3">
              <CCol lg={5}>
                <CCard className="calendar-panel">
                  <CCardBody className="p-2">
                    <h2 className="h5 p-2 mb-1">Kalender {month}</h2>
                    <div className="calendar-month-desktop">
                      <ActivityCalendar days={days} selected={selected} onSelect={setSelected} />
                    </div>
                    <div className="calendar-week-mobile">
                      <WeekStrip days={days} selected={selected} onSelect={setSelected} />
                      <details>
                        <summary className="py-3">Lihat kalender sebulan</summary>
                        <ActivityCalendar days={days} selected={selected} onSelect={setSelected} />
                      </details>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol lg={7}>
                <CCard>
                  <CCardBody>
                    <h2 className="h5">{formatTableDate(selected)}</h2>
                    <p className="text-body-secondary">
                      {day.realized} terealisasi · {day.planned} rencana · {day.incidental}{' '}
                      insidental
                    </p>
                    {!data.final && (
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <FunButton
                          variant="ghost"
                          icon={APP_ICONS.selesai}
                          disabled={busy || !targets('day').length}
                          onClick={() => changeStatus(targets('day'), 'terealisasi')}
                        >
                          Tandai tanggal ini
                        </FunButton>
                        <FunButton
                          variant="ghost"
                          icon={APP_ICONS.selesai}
                          disabled={busy || !targets('week').length}
                          aria-description="Hanya kegiatan rencana pada pekan terpilih dalam bulan yang ditampilkan."
                          onClick={() => changeStatus(targets('week'), 'terealisasi')}
                        >
                          Tandai pekan ini
                        </FunButton>
                      </div>
                    )}
                    {day.kind === 'holiday' && (
                      <CAlert color="secondary">{formatTableDate(selected)} — Libur Umum</CAlert>
                    )}
                    {day.kind === 'empty' && (
                      <CAlert color="warning">
                        Hari kerja kosong. Belum ada kegiatan aktif pada tanggal ini.
                      </CAlert>
                    )}
                    {!day.records.length && (
                      <p>
                        Belum ada kegiatan pada tanggal ini.
                        {!data.final && ' Mulai dari SKP atau tambahkan kegiatan insidental.'}
                      </p>
                    )}
                    <ActivityList
                      key={selected}
                      rows={day.records}
                      renderRow={(row) => (
                        <ActivityRow
                          key={row.id}
                          row={row}
                          skpCode={
                            data.references.items.find((item) => item.id === row.skp_item_id)?.kode
                          }
                          readOnly={data.final}
                          busy={busy}
                          conflicts={findTimeConflicts(row, data.records).length}
                          onToggle={(record) =>
                            changeStatus(
                              [record],
                              record.status === 'terealisasi' ? 'rencana' : 'terealisasi',
                            )
                          }
                          onEdit={openEditor}
                          onCancel={(record) =>
                            changeStatus(
                              [record],
                              record.status === 'dibatalkan' ? 'rencana' : 'dibatalkan',
                            )
                          }
                          onDelete={setDeleting}
                        />
                      )}
                    />
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </>
        )}
      </ReferenceState>
      {editor && data && (
        <ActivityForm
          key={editor.key}
          initial={editor.initial}
          references={data.references}
          records={data.records}
          onClose={() => setEditor(null)}
          onSaved={(record, again) => {
            setDate(record.tanggal)
            if (again) setEditor({ key: generateUuid(), initial: emptyActivity(record.tanggal) })
            else setEditor(null)
          }}
        />
      )}
      {generator && <DraftGenerator month={month} onClose={() => setGenerator(false)} />}
      {deleting && (
        <CModal
          visible
          onClose={() => !remove.isPending && setDeleting(null)}
          aria-labelledby="delete-activity-title"
        >
          <CModalHeader>
            <CModalTitle id="delete-activity-title">Hapus kegiatan ini?</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p>{deleting.deskripsi}</p>
            <p>
              Penghapusan bersifat sementara. Kunci generator tetap disimpan agar kegiatan tidak
              dibuat ulang.
            </p>
            {remove.error && (
              <CAlert color="danger" role="alert">
                {remove.error.message}
              </CAlert>
            )}
          </CModalBody>
          <CModalFooter>
            <FunButton
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => setDeleting(null)}
            >
              Batal
            </FunButton>
            <FunButton
              variant="danger-hold"
              icon={APP_ICONS.hapus}
              loading={remove.isPending}
              onHoldComplete={() => remove.mutate(deleting)}
            >
              Tahan untuk hapus
            </FunButton>
          </CModalFooter>
        </CModal>
      )}
    </div>
  )
}
export default Harian
