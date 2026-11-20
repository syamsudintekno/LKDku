import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilAccountLogout, cilSettings, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useMe, useLogout } from '../../api/auth'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const { data: authData } = useMe()
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // Sesi lokal tetap diakhiri bila server tidak terjangkau.
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const profile = authData?.profile || {}

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle
        placement="bottom-end"
        className="py-0 pe-0 d-flex align-items-center"
        caret={false}
        aria-label="Menu pengguna"
      >
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
          style={{ width: '38px', height: '38px', backgroundColor: '#1f5f5b' }}
        >
          {(profile.nama || authData?.user?.username || 'P').slice(0, 1).toUpperCase()}
        </div>
      </CDropdownToggle>
      <CDropdownMenu
        className="pt-0 shadow-sm border-0"
        placement="bottom-end"
        style={{ borderRadius: '10px' }}
      >
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2 py-2">
          <div>{profile.nama || authData?.user?.username || 'Pengguna'}</div>
          <div className="small fw-normal text-body-secondary">
            NIP: {profile.nip || 'Belum diisi'}
          </div>
        </CDropdownHeader>
        <CDropdownItem
          as="button"
          type="button"
          onClick={() => navigate('/pengaturan')}
          style={{ cursor: 'pointer' }}
        >
          <CIcon icon={cilUser} className="me-2" />
          Profil Pegawai
        </CDropdownItem>
        <CDropdownItem
          as="button"
          type="button"
          onClick={() => navigate('/pengaturan')}
          style={{ cursor: 'pointer' }}
        >
          <CIcon icon={cilSettings} className="me-2" />
          Pengaturan
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem
          as="button"
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="text-danger"
          style={{ cursor: 'pointer' }}
        >
          <CIcon icon={cilAccountLogout} className="me-2 text-danger" />
          Keluar
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
