import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CAlert, CSpinner } from '@coreui/react'
import { useMe, useLogout, useSessionToken } from '../api/auth'
import FunButton from './ui/FunButton'
import { APP_ICONS } from './ui/icons'

const RequireSession = ({ children }) => {
  const token = useSessionToken()
  const session = useMe()
  const logout = useLogout()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) queryClient.clear()
  }, [token, queryClient])

  if (!token) return <Navigate to="/login" replace />
  if (session.isPending) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" role="status">
        <CSpinner size="sm" className="me-2" /> Memeriksa sesi...
      </div>
    )
  }
  if (session.isError) {
    return (
      <main className="container py-5">
        <CAlert color="danger" role="alert">
          {session.error.message}
        </CAlert>
        <FunButton icon={APP_ICONS.ulang} onClick={() => session.refetch()}>
          Coba lagi
        </FunButton>
        <FunButton variant="ghost" icon={APP_ICONS.logout} onClick={() => logout.mutate()}>
          Keluar
        </FunButton>
      </main>
    )
  }
  return children
}

RequireSession.propTypes = { children: PropTypes.node.isRequired }
export default RequireSession
