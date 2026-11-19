import React from 'react'

const Beranda = React.lazy(() => import('./views/beranda/Beranda'))
const Harian = React.lazy(() => import('./views/harian/Harian'))
const Laporan = React.lazy(() => import('./views/laporan/Laporan'))
const Skp = React.lazy(() => import('./views/skp/Skp'))
const Pengaturan = React.lazy(() => import('./views/pengaturan/Pengaturan'))

export const routes = [
  { path: '/', exact: true, name: 'Root' },
  { path: '/beranda', name: 'Beranda', element: Beranda },
  { path: '/harian', name: 'Pencatatan Harian', element: Harian },
  { path: '/laporan', name: 'Laporan Bulanan', element: Laporan },
  { path: '/skp', name: 'Rencana SKP', element: Skp },
  { path: '/pengaturan', name: 'Pengaturan', element: Pengaturan },
]

export default routes
