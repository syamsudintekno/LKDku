import React from 'react'
import PropTypes from 'prop-types'
import { BULAN_INDONESIA, formatTableDate, formatSignatureDate } from '../../domain/dateId'
import './report.css'

const ReportDocument = ({ report, final = false }) => {
  const profile = report.profile
  return (
    <article className="report-document" aria-label="Pratinjau Laporan Kinerja Bulanan">
      <header>
        {profile.logo_kop && (
          <img className="report-logo" src={profile.logo_kop} alt="Logo institusi" />
        )}
        {['kop_1', 'kop_2', 'kop_3', 'alamat_kop'].map(
          (key) => profile[key] && <p key={key}>{profile[key]}</p>,
        )}
      </header>
      <h1>LAPORAN KINERJA BULANAN</h1>
      <p className="period">
        Periode: Bulan {BULAN_INDONESIA[Number(report.month.slice(5)) - 1]} Tahun{' '}
        {report.month.slice(0, 4)}
      </p>
      <table className="identity">
        <tbody>
          {[
            ['Nama', 'nama'],
            ['NIP', 'nip'],
            ['Jabatan', 'jabatan'],
            ['Unit Kerja', 'unit_kerja'],
            ['Satuan Kerja', 'satuan_kerja'],
          ].map(([label, key]) => (
            <tr key={key}>
              <td>
                <b>{label}</b>
              </td>
              <td>:</td>
              <td>{profile[key] || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="report">
        <colgroup>
          {[17, 5, 46, 12, 8, 12].map((width, index) => (
            <col key={index} style={{ width: `${width}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {[
              'Hari / Tanggal',
              'No.',
              'Deskripsi Laporan Kinerja',
              'Unsur Tridharma',
              'Jumlah',
              'Satuan',
            ].map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((day) =>
            day.kind === 'holiday' ? (
              <tr key={day.tanggal}>
                <td colSpan={6} className="holiday">
                  {formatTableDate(day.tanggal)} — Libur Umum
                </td>
              </tr>
            ) : (
              day.records.map((row, index) => (
                <tr
                  key={row.id || `${day.tanggal}-${index}`}
                  className={!final && row.status === 'rencana' ? 'report-planned' : ''}
                >
                  <td>{index === 0 ? formatTableDate(day.tanggal) : ''}</td>
                  <td className="center">{row.nomor}</td>
                  <td>
                    {row.deskripsi_laporan}
                    {!final && row.status === 'rencana' && (
                      <strong className="report-screen-label">Belum terealisasi</strong>
                    )}
                    {!final && row.sumber === 'insidental' && (
                      <span className="report-screen-label">Insidental</span>
                    )}
                  </td>
                  <td className="center">{row.unsur}</td>
                  <td className="center">{row.jumlah}</td>
                  <td className="center">{row.satuan}</td>
                </tr>
              ))
            ),
          )}
        </tbody>
      </table>
      <section className="closing">
        <p>Demikian laporan kinerja bulanan ini dibuat berdasarkan yang sebenarnya.</p>
        <table className="signatures">
          <tbody>
            <tr>
              <td>
                Mengetahui,
                <br />
                {profile.atasan_jabatan},
              </td>
              <td>
                {formatSignatureDate(report.tanggal_ttd, profile.kota_ttd)}
                <br />
                Yang membuat laporan,
              </td>
            </tr>
            <tr>
              <td className="space"></td>
              <td></td>
            </tr>
            <tr>
              <td>
                {profile.atasan_nama}
                <br />
                NIP. {profile.atasan_nip}
              </td>
              <td>
                {profile.nama}
                <br />
                NIP. {profile.nip}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  )
}
ReportDocument.propTypes = { report: PropTypes.object.isRequired, final: PropTypes.bool }
export default ReportDocument
