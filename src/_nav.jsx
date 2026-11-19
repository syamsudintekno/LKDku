import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilCalendar, cilDescription, cilTask, cilSettings } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Beranda',
    to: '/beranda',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Kinerja Dosen',
  },
  {
    component: CNavItem,
    name: 'Pencatatan Harian',
    to: '/harian',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Laporan Bulanan',
    to: '/laporan',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Rencana SKP',
    to: '/skp',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Sistem',
  },
  {
    component: CNavItem,
    name: 'Pengaturan',
    to: '/pengaturan',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default _nav
