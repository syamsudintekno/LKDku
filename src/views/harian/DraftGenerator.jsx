import React from 'react'
import PropTypes from 'prop-types'
import { CAlert, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import { useActivityMutation, useDraftPreview } from '../../api/activity'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
import { activityDescription } from '../../domain/activity'
import { formatTableDate } from '../../domain/dateId'

const DraftGenerator = ({ month, onClose }) => {
  const preview = useDraftPreview()
  const generate = useActivityMutation('plan.generate', { onSaved: onClose })
  const current = preview.variables === month && preview.data
  return (
    <CModal
      visible
      size="lg"
      scrollable
      backdrop="static"
      onClose={() => !generate.isPending && onClose()}
      aria-labelledby="generator-title"
    >
      <CModalHeader closeButton={!generate.isPending}>
        <CModalTitle id="generator-title">Buat draft {month}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>
          Generator menambahkan kegiatan berstatus rencana dari SKP aktif. Jadwal lama yang
          disunting, dipindahkan, dibatalkan, atau dihapus sementara tidak dibuat ulang.
        </p>
        <FunButton
          icon={APP_ICONS.calendar}
          loading={preview.isPending}
          disabled={generate.isPending}
          onClick={() => preview.mutate(month)}
        >
          Periksa draft
        </FunButton>
        {(preview.error || generate.error) && (
          <CAlert color="danger" className="mt-3" role="alert">
            {preview.error?.message || generate.error?.message}
          </CAlert>
        )}
        {current && (
          <div className="mt-3">
            <p aria-live="polite">
              {current.candidates.length} kegiatan baru; {current.skipped} kunci sudah ada;{' '}
              {current.activeTemplates} template aktif.
            </p>
            {!current.activeTemplates && (
              <CAlert color="info">
                Belum ada template dari SKP aktif pada tahun ini. Aktifkan SKP dan siapkan template
                terlebih dahulu.
              </CAlert>
            )}
            {current.warnings.length > 0 && (
              <CAlert color="warning">
                Ada bentrok jam pada {current.warnings.length} calon kegiatan. Periksa jadwal;
                penyimpanan tetap diizinkan.
              </CAlert>
            )}
            <ol className="ps-3">
              {current.candidates.map((row) => (
                <li className="mb-2" key={row.generated_key}>
                  <strong>{formatTableDate(row.tanggal)}</strong>
                  <br />
                  {activityDescription(row)} · {row.jumlah} {row.satuan}
                </li>
              ))}
            </ol>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <FunButton variant="ghost" disabled={generate.isPending} onClick={onClose}>
          Tutup
        </FunButton>
        <FunButton
          icon={APP_ICONS.simpan}
          loading={generate.isPending}
          disabled={!current || !current.candidates.length || preview.isPending}
          onClick={() =>
            generate.mutate({
              month,
              dryRun: false,
              previewVersion: current.previewVersion,
              _preview: current.candidates,
            })
          }
        >
          Simpan draft rencana
        </FunButton>
      </CModalFooter>
    </CModal>
  )
}
DraftGenerator.propTypes = {
  month: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}
export default DraftGenerator
