import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CForm,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import ReferenceFields from './ReferenceFields'
import FunButton from './FunButton'
import { APP_ICONS } from './icons'
import { useReferenceMutation } from '../../api/reference'

const ReferenceModal = ({ title, fields, initial, action, onClose, onSaved, children }) => {
  const [value, setValue] = useState(initial)
  const formRef = useRef(null)
  const hold = action === 'skp.year.upsert' && value.status === 'arsip'
  const mutation = useReferenceMutation(action, {
    onSaved: (saved) => {
      onSaved?.(saved)
      onClose()
    },
  })
  return (
    <CModal
      visible
      size="lg"
      scrollable
      backdrop="static"
      onClose={() => !mutation.isPending && onClose()}
      aria-labelledby="reference-modal-title"
    >
      <CModalHeader closeButton={!mutation.isPending}>
        <CModalTitle id="reference-modal-title">{title}</CModalTitle>
      </CModalHeader>
      <CForm
        className="reference-modal-form"
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault()
          if (!hold) mutation.mutate(value)
        }}
      >
        <CModalBody>
          {mutation.error && (
            <CAlert color="danger" role="alert">
              {mutation.error.message}
            </CAlert>
          )}
          <ReferenceFields
            fields={fields}
            value={value}
            onChange={setValue}
            disabled={mutation.isPending}
          />
          {children?.(value, setValue)}
        </CModalBody>
        <CModalFooter>
          <FunButton variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Batal
          </FunButton>
          <FunButton
            type={hold ? 'button' : 'submit'}
            variant={hold ? 'danger-hold' : 'primary'}
            onHoldComplete={() => {
              if (formRef.current.reportValidity()) mutation.mutate(value)
            }}
            icon={APP_ICONS.simpan}
            loading={mutation.isPending}
          >
            {hold ? 'Tahan untuk arsipkan' : 'Simpan'}
          </FunButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
ReferenceModal.propTypes = {
  title: PropTypes.string.isRequired,
  fields: PropTypes.array.isRequired,
  initial: PropTypes.object.isRequired,
  action: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
  children: PropTypes.func,
}
export default ReferenceModal
