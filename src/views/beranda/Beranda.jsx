import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CBadge, CCard, CCardBody, CCol, CRow, CForm, CFormInput } from '@coreui/react'
import { useDashboard } from '../../api/maintenance'
import { useActivityMutation } from '../../api/activity'
import { currentJakartaDate, formatTableDate, BULAN_INDONESIA } from '../../domain/dateId'
import ReferenceState from '../../components/ui/ReferenceState'
import FunButton from '../../components/ui/FunButton'
import DoneCheck from '../../components/ui/DoneCheck'
import IncidentalBadge from '../../components/ui/IncidentalBadge'
import { APP_ICONS } from '../../components/ui/icons'
import ProgressMeter from '../../components/ui/ProgressMeter'
import AnimatedCount from '../../components/ui/AnimatedCount'
import { useMotionPref } from '../../motion/useMotionPref'
import { celebrateAchievement } from '../../motion/confetti'
import { dashboardMilestones } from '../../domain/dashboard'
import { motion } from 'motion/react'
import { activityRowMotion } from '../../motion/variants'

const Beranda = () => {
  const { mode } = useMotionPref(),
    before = useRef(null),
    celebration = useRef(() => {})
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => () => celebration.current(), [mode])
  const [month, setMonth] = useState(currentJakartaDate().slice(0, 7)),
    [input, setInput] = useState(month)
  const query = useDashboard(month),
    data = query.data
  const status = useActivityMutation('activity.bulkStatus', {
    onSaved: () => {
      const previous = before.current
      void query
        .refetch()
        .then((result) => {
          if (!result.isSuccess) return
          const milestone = dashboardMilestones(previous, result.data)
          if (milestone.targets.length || milestone.monthComplete) {
            setAnnouncement(
              milestone.targets.length
                ? `Target ${milestone.targets.join(', ')} mencapai 100%. Kegiatan sudah tersimpan.`
                : 'Seluruh hari kerja bulan ini sudah terealisasi.',
            )
            celebration.current()
            celebration.current = celebrateAchievement(mode)
          }
        })
        .catch(() => {})
    },
  })
  const change = (rows) => {
    before.current = data
    status.mutate({
      changes: rows.map((row) => ({ id: row.id, updated_at: row.updated_at })),
      status: 'terealisasi',
    })
  }
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <div>
          <h1 className="h3 mb-1">Beranda</h1>
          <p className="text-body-secondary mb-0">Capaian dari kegiatan yang sudah tersimpan.</p>
        </div>
        <FunButton as={Link} icon={APP_ICONS.tambah} to={`/harian?date=${currentJakartaDate()}`}>
          Kegiatan hari ini
        </FunButton>
      </div>
      <CForm
        className="d-flex flex-wrap gap-2 align-items-end mb-3"
        onSubmit={(event) => {
          event.preventDefault()
          setMonth(input)
        }}
      >
        <CFormInput
          id="dashboard-month"
          type="month"
          min="1900-01"
          max="2200-12"
          label="Bulan ringkasan"
          required
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <FunButton type="submit" variant="ghost" icon={APP_ICONS.calendar}>
          Tampilkan ringkasan
        </FunButton>
      </CForm>
      <div role="status" aria-live="polite">
        {announcement}
      </div>
      <ReferenceState query={query}>
        {data && (
          <>
            <CRow className="g-3 mb-3">
              {[
                ['Terealisasi', data.monthly.realized],
                ['Rencana', data.monthly.planned],
                ['Insidental terealisasi', data.monthly.incidental],
              ].map(([label, value], index) => (
                <CCol sm={4} key={label}>
                  <CCard
                    as={mode === 'mati' ? 'div' : motion.div}
                    {...activityRowMotion(index, mode)}
                    className="h-100"
                  >
                    <CCardBody>
                      <h2 className="h6 text-body-secondary">{label}</h2>
                      <p className="h2 mb-0">
                        <AnimatedCount value={value} />
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>
            <CCard className="mb-3">
              <CCardBody>
                <h2 className="h5">Hari kerja {BULAN_INDONESIA[Number(month.slice(5)) - 1]}</h2>
                <p>
                  {data.workdays.filled}/{data.workdays.total} hari terisi ·{' '}
                  {data.workdays.complete} hari seluruh kegiatannya terealisasi
                </p>
                <ProgressMeter
                  max={data.workdays.total || 1}
                  value={data.workdays.filled}
                  label="Hari kerja terisi"
                />
                <p className="small text-body-secondary mb-0 mt-2">
                  Rasio insidental: {data.monthly.incidentalRatio.toFixed(1)}% dari jumlah kegiatan
                  terealisasi.
                </p>
              </CCardBody>
            </CCard>
            <CRow className="g-3 mb-3">
              <CCol lg={6}>
                <CCard className="h-100">
                  <CCardBody>
                    <h2 className="h5">Hari ini · {formatTableDate(data.today)}</h2>
                    {data.todayFinal && (
                      <p role="status">Bulan hari ini sudah final. Kegiatan hanya dapat dibaca.</p>
                    )}
                    {!data.todayRecords.length ? (
                      <p>
                        Belum ada kegiatan hari ini.{' '}
                        <Link to={`/harian?date=${data.today}`}>Buka Harian</Link>
                      </p>
                    ) : (
                      <>
                        <FunButton
                          variant="ghost"
                          icon={APP_ICONS.selesai}
                          disabled={
                            status.isPending ||
                            data.todayFinal ||
                            !data.todayRecords.some((row) => row.status === 'rencana')
                          }
                          onClick={() =>
                            change(data.todayRecords.filter((row) => row.status === 'rencana'))
                          }
                        >
                          Tandai semua selesai
                        </FunButton>
                        {data.todayRecords.map((row) => (
                          <div
                            key={row.id}
                            className="d-flex gap-2 align-items-center border-top py-2"
                          >
                            <DoneCheck
                              label={`Terealisasi: ${row.deskripsi}`}
                              checked={row.status === 'terealisasi'}
                              pending={
                                status.isPending &&
                                status.variables?.changes.some((change) => change.id === row.id)
                              }
                              disabled={
                                status.isPending || data.todayFinal || row.status === 'terealisasi'
                              }
                              onChange={() => change([row])}
                            />
                            <div>
                              {row.deskripsi}
                              <div className="small text-body-secondary">
                                {row.status === 'terealisasi' ? 'Terealisasi' : 'Rencana'} ·{' '}
                                {row.jumlah} {row.satuan}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol lg={6}>
                <CCard className="h-100">
                  <CCardBody>
                    <h2 className="h5">Perlu perhatian</h2>
                    {data.zeroUnsur.map((unsur) => (
                      <p key={unsur}>
                        <CBadge color="warning">Periksa</CBadge> Belum ada kegiatan terealisasi
                        unsur {unsur}.
                      </p>
                    ))}
                    <p>
                      {data.emptyWorkdays.length} hari kerja kosong sampai {data.today}, terbatas
                      pada bulan pilihan.
                    </p>
                    {data.emptyWorkdays[0] && (
                      <Link to={`/harian?date=${data.emptyWorkdays[0]}`}>
                        Periksa tanggal kosong pertama
                      </Link>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
            <CCard className="mb-3">
              <CCardBody>
                <h2 className="h5">Capaian SKP {month.slice(0, 4)}</h2>
                {!data.items.length ? (
                  <p>
                    Belum ada butir SKP. <Link to="/skp">Susun SKP</Link>
                  </p>
                ) : (
                  data.items.map((item) => (
                    <section key={item.id} className="border-top py-3">
                      <div className="d-flex flex-wrap justify-content-between gap-2">
                        <h3 className="h6">
                          {item.kode} · {item.rencana_hasil_kerja}
                        </h3>
                        <span>
                          {item.realized}/{item.target_tahunan || '—'} {item.satuan_target} ·{' '}
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>
                      <ProgressMeter
                        max={100}
                        value={Math.min(100, item.percent)}
                        label={`Capaian ${item.kode}`}
                      />
                      <p className="small mt-2 mb-1">
                        Realisasi {BULAN_INDONESIA[Number(month.slice(5)) - 1]}:{' '}
                        {item.monthly[Number(month.slice(5)) - 1]} {item.satuan_target}
                      </p>
                      {item.otherUnits.map((unit) => (
                        <p className="small text-warning-emphasis mb-1" key={unit.satuan}>
                          {unit.jumlah} {unit.satuan} ({unit.count} kegiatan) ditampilkan terpisah
                          dari target {item.satuan_target}.
                        </p>
                      ))}
                      <details className="small mt-2">
                        <summary>Realisasi per bulan</summary>
                        <dl className="row mt-2 mb-0">
                          {item.monthly.map((amount, index) => (
                            <React.Fragment key={index}>
                              <dt className="col-6">{BULAN_INDONESIA[index]}</dt>
                              <dd className="col-6">
                                {amount} {item.satuan_target}
                              </dd>
                            </React.Fragment>
                          ))}
                        </dl>
                      </details>
                    </section>
                  ))
                )}
              </CCardBody>
            </CCard>
            <CCard className="mb-3">
              <CCardBody>
                <h2 className="h5">Ringkasan unsur</h2>
                <div className="d-flex flex-wrap gap-3">
                  {data.unsur.map((row) => (
                    <span key={row.unsur}>
                      {row.unsur}: <strong>{row.count}</strong> kegiatan
                    </span>
                  ))}
                </div>
              </CCardBody>
            </CCard>
            <CCard>
              <CCardBody>
                <h2 className="h5">Kegiatan insidental</h2>
                <p className="small text-body-secondary">
                  Pemetaan khusus tersedia pada v1.1. Periksa dan sunting kegiatan melalui Harian.
                </p>
                {!data.incidental.length ? (
                  <p className="mb-0">Tidak ada kegiatan insidental pada bulan ini.</p>
                ) : (
                  data.incidental.map((row) => (
                    <div key={row.id} className="border-top py-2">
                      <IncidentalBadge /> {row.deskripsi}{' '}
                      <span className="small">({row.status})</span>
                      <p className="small mb-1">{row.alasan_insidental}</p>
                      <Link to={`/harian?date=${row.tanggal}`}>
                        Buka kegiatan {formatTableDate(row.tanggal)}
                      </Link>
                    </div>
                  ))
                )}
              </CCardBody>
            </CCard>
          </>
        )}
      </ReferenceState>
    </>
  )
}
export default Beranda
