import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'
import { routes } from '../routes'

const AppBreadcrumb = () => {
  const { pathname } = useLocation()
  const route = routes.find((item) => item.path === pathname)
  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem>
        <Link to="/beranda">Beranda</Link>
      </CBreadcrumbItem>
      {pathname !== '/beranda' && route && <CBreadcrumbItem active>{route.name}</CBreadcrumbItem>}
    </CBreadcrumb>
  )
}
export default React.memo(AppBreadcrumb)
