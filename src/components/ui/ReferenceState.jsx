import React from 'react'
import PropTypes from 'prop-types'
import { CAlert, CSpinner } from '@coreui/react'
import FunButton from './FunButton'
import { APP_ICONS } from './icons'

const ReferenceState = ({ query, children }) => {
  if (query.isPending)
    return (
      <div className="py-4" role="status">
        <CSpinner size="sm" className="me-2" />
        Memuat data...
      </div>
    )
  if (query.isError)
    return (
      <CAlert color="danger">
        <p role="alert">{query.error.message}</p>
        <FunButton icon={APP_ICONS.ulang} onClick={() => query.refetch()}>
          Coba lagi
        </FunButton>
      </CAlert>
    )
  return children
}
ReferenceState.propTypes = { query: PropTypes.object.isRequired, children: PropTypes.node }
export default ReferenceState
