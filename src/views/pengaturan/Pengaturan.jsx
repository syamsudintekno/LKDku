import React, { useState } from 'react'
import { CAlert, CCard, CCardBody, CFormSelect, CNav, CNavItem, CNavLink } from '@coreui/react'
import { useMotionPref } from '../../motion/useMotionPref'
import { useReferenceData } from '../../api/reference'
import { currentJakartaYear } from '../../domain/dateId'
import ReferenceState from '../../components/ui/ReferenceState'
import ProfileForm from './ProfileForm'
import HolidaySettings from './HolidaySettings'
import YearPicker from '../../components/ui/YearPicker'
import BackupSettings from './BackupSettings'
import UnitSettings from './UnitSettings'
import SecuritySettings from './SecuritySettings'

const Pengaturan = () => {
  const { savedMode, setMode, reduced } = useMotionPref()
  const [tab, setTab] = useState('profile')
  const [tahun, setTahun] = useState(currentJakartaYear())
  const query = useReferenceData(tahun)
  return (
    <>
      <h1 className="h3 mb-3">Pengaturan</h1>
      <CNav variant="tabs" className="mb-3" role="tablist" aria-label="Bagian pengaturan">
        {[
          ['profile', 'Profil dan kop'],
          ['holidays', 'Hari libur'],
          ['appearance', 'Tampilan'],
          ['units', 'Unsur dan satuan'],
          ['security', 'Keamanan'],
          ['backup', 'Cadangan'],
        ].map(([key, label]) => (
          <CNavItem key={key}>
            <CNavLink
              as="button"
              type="button"
              role="tab"
              active={tab === key}
              aria-selected={tab === key}
              aria-controls={`settings-${key}`}
              id={`tab-${key}`}
              onKeyDown={(event) => {
                const keys = ['profile', 'holidays', 'appearance', 'units', 'security', 'backup']
                const index = keys.indexOf(key)
                const next =
                  event.key === 'ArrowRight'
                    ? keys[(index + 1) % keys.length]
                    : event.key === 'ArrowLeft'
                      ? keys[(index + keys.length - 1) % keys.length]
                      : event.key === 'Home'
                        ? keys[0]
                        : event.key === 'End'
                          ? keys.at(-1)
                          : null
                if (next) {
                  event.preventDefault()
                  setTab(next)
                  document.getElementById(`tab-${next}`).focus()
                }
              }}
              tabIndex={tab === key ? 0 : -1}
              onClick={() => setTab(key)}
            >
              {label}
            </CNavLink>
          </CNavItem>
        ))}
      </CNav>
      <CCard className="shadow-sm">
        <CCardBody role="tabpanel" id={`settings-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'backup' ? (
            <BackupSettings />
          ) : tab === 'units' ? (
            <UnitSettings />
          ) : tab === 'security' ? (
            <SecuritySettings />
          ) : tab === 'appearance' ? (
            <>
              <h2 className="h5 mb-3">Tampilan dan gerak</h2>
              <CFormSelect
                id="motion-mode"
                label="Mode animasi"
                value={savedMode}
                onChange={(event) => setMode(event.target.value)}
                options={[
                  { value: 'ceria', label: 'Ceria' },
                  { value: 'tenang', label: 'Tenang' },
                  { value: 'mati', label: 'Mati' },
                ]}
              />
              <p className="small text-body-secondary mt-2">Pilihan disimpan di perangkat ini.</p>
              {reduced && (
                <CAlert color="info">
                  Pengaturan perangkat mengurangi gerakan. Animasi dimatikan.
                </CAlert>
              )}
            </>
          ) : (
            <>
              {tab === 'holidays' && <YearPicker value={tahun} onChange={setTahun} />}
              <ReferenceState query={query}>
                {query.data &&
                  (tab === 'profile' ? (
                    <ProfileForm data={query.data} />
                  ) : (
                    <HolidaySettings data={query.data} />
                  ))}
              </ReferenceState>
            </>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}
export default Pengaturan
