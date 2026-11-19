import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4 py-2 border-top">
      <div>
        <span className="fw-semibold">LKB-App</span>
        <span className="ms-1">&copy; 2026 Ahmad Syamsudin, M.Kom. · UIN Syekh Wasil Kediri</span>
      </div>
      <div className="ms-auto text-body-secondary small">
        <span className="me-1">Dibangun dengan</span>
        <a
          href="https://coreui.io/react"
          target="_blank"
          rel="noopener noreferrer"
          className="text-decoration-none"
        >
          CoreUI React
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
