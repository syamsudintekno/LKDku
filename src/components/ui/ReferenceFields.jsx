import React, { useId } from 'react'
import PropTypes from 'prop-types'
import { CCol, CFormInput, CFormSelect, CFormTextarea, CRow } from '@coreui/react'

const ReferenceFields = ({ fields, value, onChange, disabled = false }) => {
  const prefix = useId()
  return (
    <CRow className="g-3">
      {fields.map((field) => {
        const props = {
          id: `${prefix}-${field.name}`,
          label: field.label,
          value: value[field.name] ?? '',
          required: field.required,
          autoComplete: 'off',
          disabled: disabled || field.disabled,
          onChange: (event) => onChange({ ...value, [field.name]: event.target.value }),
        }
        return (
          <CCol key={field.name} md={field.wide ? 12 : 6}>
            {field.options ? (
              <CFormSelect {...props} options={field.options} />
            ) : field.multiline ? (
              <CFormTextarea
                {...props}
                rows={field.rows || 3}
                maxLength={field.maxLength || 1000}
              />
            ) : (
              <CFormInput
                {...props}
                type={field.type || 'text'}
                min={field.min}
                max={field.max}
                step={field.step}
                maxLength={field.maxLength || 1000}
              />
            )}
            {field.help && <div className="form-text">{field.help}</div>}
          </CCol>
        )
      })}
    </CRow>
  )
}
ReferenceFields.propTypes = {
  fields: PropTypes.array.isRequired,
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}
export default ReferenceFields
