import React, { useState } from 'react'
import { CAlert, CFormInput, CFormSelect } from '@coreui/react'
import { useMaintenanceAction } from '../../api/maintenance'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import { downloadText } from '../../components/ui/downloadFile'
const sheets = [
  'profile',
  'config',
  'skp_year',
  'skp_item',
  'skp_template',
  'holiday',
  'activity',
  'report_month',
  'audit_log',
]
const sheetNames = {
  profile: 'Profil',
  config: 'Unsur dan satuan',
  skp_year: 'SKP tahunan',
  skp_item: 'Butir SKP',
  skp_template: 'Template kegiatan',
  holiday: 'Hari libur',
  activity: 'Kegiatan harian',
  report_month: 'Laporan bulanan',
  audit_log: 'Riwayat audit',
}
const BackupSettings = () => {
  const [sheet, setSheet] = useState('activity'),
    [document, setDocument] = useState(null),
    [preview, setPreview] = useState(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [reading, setReading] = useState(false)
  const exported = useMaintenanceAction('backup.export', (result) => {
    downloadText(
      result.filename || 'LKB-cadangan.json',
      result.content || JSON.stringify(result.document),
      result.content ? 'text/csv;charset=utf-8' : 'application/json',
    )
    setMessage('Cadangan disiapkan untuk diunduh. Simpan berkas di tempat pribadi.')
  })
  const checked = useMaintenanceAction('backup.import', (result) => setPreview(result))
  const imported = useMaintenanceAction('backup.import', (result) => {
    setMessage(`${result.count} record dipulihkan. Data berbeda tidak ditimpa.`)
    setPreview(null)
    setDocument(null)
  })
  const busy = reading || exported.isPending || checked.isPending || imported.isPending
  return (
    <>
      <h2 className="h5">Cadangan dan pemulihan</h2>
      <p>
        Cadangan berisi data bisnis dan data pribadi profil. Password, salt, pepper, serta token
        sesi tidak disertakan. Audit diekspor untuk arsip dan tidak diimpor kembali.
      </p>
      {message && (
        <CAlert color="success" role="status">
          {message}
        </CAlert>
      )}
      <FunButton
        icon={APP_ICONS.download}
        disabled={busy}
        loading={exported.isPending}
        onClick={() => exported.mutate({ format: 'json' })}
      >
        Unduh cadangan JSON
      </FunButton>
      <div className="d-flex flex-wrap gap-2 align-items-end my-3">
        <CFormSelect
          id="backup-sheet"
          label="Ekspor CSV per sheet"
          value={sheet}
          onChange={(event) => setSheet(event.target.value)}
          disabled={busy}
          options={sheets.map((value) => ({ value, label: sheetNames[value] }))}
        />
        <FunButton
          variant="ghost"
          icon={APP_ICONS.download}
          disabled={busy}
          onClick={() => exported.mutate({ format: 'csv', sheet })}
        >
          Unduh CSV
        </FunButton>
      </div>
      <hr />
      <h3 className="h6">Pulihkan dari JSON</h3>
      <p>
        Impor menambah record yang belum ada dan mengisi profil awal yang kosong. Record berbeda
        ditolak, bulan final tetap terlindungi. Unduh cadangan kondisi sekarang terlebih dahulu.
      </p>
      <CFormInput
        id="backup-file"
        type="file"
        accept="application/json,.json"
        label="Berkas cadangan JSON (maksimal 2 MB)"
        disabled={busy}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          setPreview(null)
          setDocument(null)
          setError('')
          setMessage('')
          checked.reset()
          imported.reset()
          if (!file) return
          if (file.size > 2000000) {
            setError('Berkas melebihi 2 MB.')
            return
          }
          setReading(true)
          try {
            const value = JSON.parse(await file.text())
            setDocument(value)
          } catch {
            setError('Berkas bukan JSON yang dapat dibaca.')
          } finally {
            setReading(false)
          }
        }}
      />
      {reading && <p role="status">Membaca berkas...</p>}
      {error && (
        <CAlert color="danger" role="alert" className="mt-3">
          {error}
        </CAlert>
      )}
      <FunButton
        className="mt-3"
        variant="ghost"
        icon={APP_ICONS.calendar}
        disabled={!document || busy}
        loading={checked.isPending}
        onClick={() => {
          setPreview(null)
          checked.mutate({ document, dryRun: true })
        }}
      >
        Periksa pemulihan
      </FunButton>
      {preview && (
        <div className="mt-3">
          <h3 className="h6">Pratinjau: {preview.count} record akan dipulihkan</h3>
          <ul>
            {preview.summary.map((row) => (
              <li key={row.sheet}>
                {sheetNames[row.sheet] || row.sheet}: {row.added} ditambahkan/diisi, {row.skipped}{' '}
                sudah sama
              </li>
            ))}
          </ul>
          <p>
            Dengan menahan tombol, saya mengonfirmasi isi pratinjau dan sudah menyimpan cadangan
            kondisi sekarang.
          </p>
          <FunButton
            variant="danger-hold"
            icon={APP_ICONS.ulang}
            disabled={busy || !preview.count}
            loading={imported.isPending}
            onHoldComplete={() =>
              imported.mutate({
                document,
                dryRun: false,
                version: preview.version,
                confirmed: true,
              })
            }
          >
            Tahan untuk pulihkan data
          </FunButton>
        </div>
      )}
      {(checked.error || imported.error || exported.error) && (
        <CAlert className="mt-3" color="danger" role="alert">
          {(checked.error || imported.error || exported.error).message}
        </CAlert>
      )}
    </>
  )
}
export default BackupSettings
