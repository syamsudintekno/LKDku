import React, { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { CToast, CToastBody, CToastClose, CToaster } from '@coreui/react'
import FunButton from './FunButton'
import { APP_ICONS } from './icons'

const FeedbackContext = createContext(() => {})
export const FeedbackProvider = ({ children }) => {
  const [messages, setMessages] = useState([])
  const notify = (message) =>
    setMessages((current) => [...current.slice(-3), { ...message, id: crypto.randomUUID() }])
  const dismiss = (id) => setMessages((current) => current.filter((message) => message.id !== id))
  return (
    <FeedbackContext.Provider value={notify}>
      {children}
      <CToaster placement="bottom-end" className="p-3 feedback-toaster">
        {messages.map((message) => (
          <CToast
            role={message.error ? 'alert' : 'status'}
            aria-live={message.error ? 'assertive' : 'polite'}
            key={message.id}
            visible
            color={message.error ? 'danger' : 'success'}
            autohide={!message.error}
            delay={message.undo ? 5000 : 4000}
            onClose={() => dismiss(message.id)}
          >
            <CToastBody>
              <div className="d-flex align-items-start gap-2">
                <span className="flex-grow-1">{message.text}</span>
                <CToastClose aria-label="Tutup pemberitahuan" onClick={() => dismiss(message.id)} />
              </div>
              {(message.undo || message.retry) && (
                <FunButton
                  variant="ghost"
                  color="light"
                  icon={APP_ICONS.ulang}
                  className="mt-2"
                  onClick={() => {
                    dismiss(message.id)
                    ;(message.undo || message.retry)()
                  }}
                >
                  {message.undo ? 'Urungkan' : message.conflict ? 'Muat ulang' : 'Coba lagi'}
                </FunButton>
              )}
            </CToastBody>
          </CToast>
        ))}
      </CToaster>
    </FeedbackContext.Provider>
  )
}
FeedbackProvider.propTypes = { children: PropTypes.node.isRequired }
export const useFeedback = () => useContext(FeedbackContext)
