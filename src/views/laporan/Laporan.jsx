import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CNav,
  CNavItem,
  CNavLink,
} from '@coreui/react'
import { currentJakartaDate, BULAN_INDONESIA } from '../../domain/dateId'
import { useReport, useReportList, useReportMutation } from '../../api/report'
import FunButton from '../../components/ui/FunButton'
import ReferenceState from '../../components/ui/ReferenceState'
import { APP_ICONS } from '../../components/ui/icons'
import ReportDocument from './ReportDocument'
import ReportPanel from './ReportPanel'
import { useMotionPref } from '../../motion/useMotionPref'
import { celebrateReport } from '../../motion/confetti'

const Laporan = () => {
  const { mode } = useMotionPref()
  const celebration = useRef(() => {})
  useEffect(() => () => celebration.current(), [mode])
  const [month, setMonth] = useState(currentJakartaDate().slice(0, 7)),
    [input, setInput] = useState(month),
    [signature, setSignature] = useState(''),
    [tab, setTab] = useState('preview'),
    [confirmed, setConfirmed] = useState(false),
    [reason, setReason] = useState(''),
    [announcement, setAnnouncement] = useState('')
  const query = useReport(month, signature || undefined),
    list = useReportList(Number(month.slice(0, 4)))
  const state = query.data
  const finalized = useReportMutation('report.finalize', (result) => {
    setAnnouncement('Laporan final dan PDF berhasil tersimpan di Drive.')
    setConfirmed(false)
    if (!result.alreadyFinal) {
      celebration.current()
      celebration.current = celebrateReport(mode)
    }
  })
  const reopened = useReportMutation('report.reopen', () => {
    setAnnouncement('Laporan dibuka kembali. Kegiatan dapat disunting.')
    setReason('')
    setConfirmed(false)
  })
  const exported = useReportMutation('report.exportPdf', () =>
    setAnnouncement('PDF tersedia dari snapshot final.'),
  )
  const busy = finalized.isPending || reopened.isPending || exported.isPending
  const choose = (next) => {
    setMonth(next)
    setInput(next)
    setSignature('')
    setConfirmed(false)
    setReason('')
    setAnnouncement('')
    finalized.reset()
    reopened.reset()
    exported.reset()
  }
  return (
    <>
      <h1 className="h3">Laporan Bulanan</h1>
      <CForm
        className="d-flex flex-wrap gap-2 align-items-end mb-3"
        onSubmit={(event) => {
          event.preventDefault()
          choose(input)
        }}
      >
        <CFormInput
          id="report-month"
          type="month"
          required
          min="1900-01"
          max="2200-12"
          label="Bulan laporan"
          value={input}
          disabled={busy}
          onChange={(event) => setInput(event.target.value)}
        />
        <FunButton type="submit" icon={APP_ICONS.calendar} disabled={busy}>
          Tampilkan laporan
        </FunButton>
      </CForm>
      <ReferenceState query={list}>
        <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Daftar laporan tahunan">
          {list.data?.map((item) => (
            <FunButton
              key={item.month}
              variant={month === item.month ? 'primary' : 'ghost'}
              disabled={busy}
              onClick={() => choose(item.month)}
            >
              {BULAN_INDONESIA[Number(item.month.slice(5)) - 1]}{' '}
              <CBadge color={item.status === 'final' ? 'success' : 'secondary'}>
                {
                  { final: 'Final', ready: 'Siap difinalisasi', draft: 'Draft', kosong: 'Kosong' }[
                    item.status
                  ]
                }
              </CBadge>
            </FunButton>
          ))}
        </div>
      </ReferenceState>
      <div role="status" aria-live="polite">
        {announcement}
      </div>
      <ReferenceState query={query}>
        {state && (
          <CCard>
            <CCardBody>
              {!state.validation.realized && !state.validation.planned && (
                <CAlert color="info">
                  Belum ada kegiatan untuk laporan bulan ini.{' '}
                  <Link to={`/harian?date=${month}-01`}>Buka pencatatan harian</Link>
                </CAlert>
              )}
              {state.final && (
                <CAlert color="success">
                  Laporan final. Pratinjau dan PDF memakai snapshot tersimpan.
                </CAlert>
              )}
              <CNav variant="tabs" className="mb-3" role="tablist" aria-label="Detail laporan">
                {[
                  ['preview', 'Pratinjau'],
                  ['validation', 'Pemeriksaan'],
                  ['export', 'Ekspor'],
                ].map(([value, label]) => (
                  <CNavItem key={value}>
                    <CNavLink
                      as="button"
                      type="button"
                      role="tab"
                      id={`report-tab-${value}`}
                      aria-controls={`report-panel-${value}`}
                      aria-selected={tab === value}
                      active={tab === value}
                      disabled={busy}
                      tabIndex={tab === value ? 0 : -1}
                      onKeyDown={(event) => {
                        const keys = ['preview', 'validation', 'export'],
                          index = keys.indexOf(value)
                        const next =
                          event.key === 'ArrowRight'
                            ? keys[(index + 1) % 3]
                            : event.key === 'ArrowLeft'
                              ? keys[(index + 2) % 3]
                              : event.key === 'Home'
                                ? keys[0]
                                : event.key === 'End'
                                  ? keys[2]
                                  : null
                        if (next) {
                          event.preventDefault()
                          setTab(next)
                          document.getElementById(`report-tab-${next}`).focus()
                        }
                      }}
                      onClick={() => setTab(value)}
                    >
                      {label}
                    </CNavLink>
                  </CNavItem>
                ))}
              </CNav>
              <ReportPanel tab={tab}>
                {tab === 'preview' && (
                  <>
                    <p className="text-body-secondary">
                      {state.final
                        ? 'Salinan final tersimpan.'
                        : 'Pratinjau mencakup rencana berpenanda; PDF final hanya memuat kegiatan terealisasi.'}{' '}
                      Geser tabel secara horizontal pada ponsel.
                    </p>
                    <div
                      className="report-scroll"
                      tabIndex={0}
                      aria-label="Dokumen laporan, dapat digulir"
                    >
                      <div className="report-paper">
                        <ReportDocument report={state.report} final={state.final} />
                      </div>
                    </div>
                  </>
                )}
                {tab === 'validation' && (
                  <>
                    <h2 className="h5">Pemeriksaan laporan</h2>
                    <p>
                      {state.validation.errors.length} Error · {state.validation.warnings.length}{' '}
                      Peringatan · {state.validation.realized} kegiatan terealisasi
                    </p>
                    {!state.validation.errors.length && (
                      <CAlert color="success">Tidak ada Error yang menghalangi finalisasi.</CAlert>
                    )}
                    {[
                      ['errors', 'danger', 'Error'],
                      ['warnings', 'warning', 'Peringatan'],
                    ].map(([key, color, label]) => (
                      <section key={key}>
                        <h3 className="h6">{label}</h3>
                        {state.validation[key].map((issue, index) => (
                          <CAlert key={`${issue.code}-${index}`} color={color}>
                            {issue.tanggal && <strong>{issue.tanggal}: </strong>}
                            {issue.message}
                            {!state.final && (
                              <Link
                                className="ms-2"
                                to={
                                  ['PROFILE', 'NO_LOGO', 'LOGO'].includes(issue.code)
                                    ? '/pengaturan'
                                    : `/harian?date=${issue.tanggal || month + '-01'}`
                                }
                              >
                                Perbaiki
                              </Link>
                            )}
                          </CAlert>
                        ))}
                      </section>
                    ))}
                    <FunButton
                      variant="ghost"
                      icon={APP_ICONS.ulang}
                      onClick={() => query.refetch()}
                      disabled={busy}
                    >
                      Periksa ulang
                    </FunButton>
                  </>
                )}
                {tab === 'export' && (
                  <>
                    <h2 className="h5">Ekspor laporan</h2>
                    {!state.final && (
                      <>
                        <CFormInput
                          id="report-signature"
                          type="date"
                          label="Tanggal tanda tangan"
                          value={signature || state.validation.tanggal_ttd}
                          onChange={(event) => {
                            setSignature(event.target.value)
                            setConfirmed(false)
                          }}
                          disabled={busy}
                          className="mb-3"
                        />
                        <p>
                          Setelah final, kegiatan bulan ini terkunci. {state.validation.planned}{' '}
                          kegiatan rencana tidak akan dimasukkan.
                        </p>
                        {state.validation.errors.length > 0 && (
                          <CAlert color="danger">
                            Perbaiki {state.validation.errors.length} Error pada tab Pemeriksaan
                            sebelum finalisasi.
                          </CAlert>
                        )}
                        <div className="form-check mb-3">
                          <input
                            id="report-confirm"
                            type="checkbox"
                            className="form-check-input"
                            checked={confirmed === state.version}
                            disabled={busy}
                            onChange={(event) =>
                              setConfirmed(event.target.checked ? state.version : false)
                            }
                          />
                          <label htmlFor="report-confirm" className="form-check-label">
                            Saya sudah memeriksa laporan dan menyetujui{' '}
                            {state.validation.warnings.length} peringatan.
                          </label>
                        </div>
                        <FunButton
                          variant="danger-hold"
                          icon={APP_ICONS.lock}
                          loading={finalized.isPending}
                          disabled={
                            confirmed !== state.version ||
                            !!state.validation.errors.length ||
                            query.isFetching ||
                            busy
                          }
                          onHoldComplete={() =>
                            finalized.mutate({
                              month,
                              tanggal_ttd: signature || state.validation.tanggal_ttd,
                              version: state.version,
                              confirmWarnings: true,
                            })
                          }
                        >
                          Tahan untuk finalisasi dan buat PDF
                        </FunButton>
                      </>
                    )}
                    {state.final && (
                      <>
                        <p>Tanggal tanda tangan: {state.report.tanggal_ttd}</p>
                        {state.record.pdf_url && (
                          <FunButton
                            as="a"
                            icon={APP_ICONS.download}
                            href={state.record.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-3"
                          >
                            Buka PDF di Drive
                          </FunButton>
                        )}
                        <div className="mb-4">
                          <FunButton
                            variant="ghost"
                            icon={APP_ICONS.download}
                            loading={exported.isPending}
                            disabled={busy}
                            onClick={() =>
                              exported.mutate({ month, updated_at: state.record.updated_at })
                            }
                          >
                            Periksa atau buat ulang PDF
                          </FunButton>
                        </div>
                        <CFormInput
                          id="report-reopen-reason"
                          label="Alasan membuka kembali"
                          value={reason}
                          maxLength={2000}
                          disabled={busy}
                          onChange={(event) => setReason(event.target.value)}
                          className="mb-3"
                        />
                        <p>
                          PDF lama tetap disimpan sebagai arsip. Finalisasi berikutnya membuat
                          snapshot dan PDF baru.
                        </p>
                        <FunButton
                          variant="danger-hold"
                          icon={APP_ICONS.ulang}
                          loading={reopened.isPending}
                          disabled={!reason.trim() || busy}
                          onHoldComplete={() =>
                            reopened.mutate({ month, reason, updated_at: state.record.updated_at })
                          }
                        >
                          Tahan untuk buka kembali
                        </FunButton>
                      </>
                    )}
                    {(finalized.error || reopened.error || exported.error) && (
                      <CAlert color="danger" role="alert" className="mt-3">
                        {(finalized.error || reopened.error || exported.error).message}
                      </CAlert>
                    )}
                  </>
                )}
              </ReportPanel>
            </CCardBody>
          </CCard>
        )}
      </ReferenceState>
    </>
  )
}
export default Laporan
