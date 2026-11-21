import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { CForm, CFormInput } from '@coreui/react'
import FunButton from './FunButton'
import { APP_ICONS } from './icons'

const YearPicker = ({ value, onChange }) => {
  const [draft, setDraft] = useState(String(value))
  return (
    <CForm
      className="d-flex flex-wrap align-items-end gap-2 mb-3"
      onSubmit={(event) => {
        event.preventDefault()
        onChange(Number(draft))
      }}
    >
      <CFormInput
        id="holiday-year"
        label="Tahun libur"
        type="number"
        min={1900}
        max={2200}
        step={1}
        required
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <FunButton type="submit" variant="ghost" icon={APP_ICONS.calendar}>
        Tampilkan tahun
      </FunButton>
    </CForm>
  )
}
YearPicker.propTypes = { value: PropTypes.number.isRequired, onChange: PropTypes.func.isRequired }
export default YearPicker
