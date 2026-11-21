import React from 'react'
import { NavLink } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import { APP_ICONS } from './ui/icons'
const MobileNav = () => (
  <nav className="mobile-bottom-nav" aria-label="Navigasi utama ringkas">
    {[
      ['/beranda', 'Beranda', APP_ICONS.dashboard],
      ['/harian', 'Harian', APP_ICONS.calendar],
      ['/laporan', 'Laporan', APP_ICONS.laporan],
      ['/skp', 'SKP', APP_ICONS.skp],
      ['/pengaturan', 'Pengaturan', APP_ICONS.settings],
    ].map(([to, label, icon]) => (
      <NavLink
        key={to}
        to={to}
        title={label}
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <CIcon icon={icon} aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
)
export default MobileNav
