import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormCheck,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilCheckCircle } from '@coreui/icons'
import { motion } from 'motion/react'
import { FunButton } from '../../components/ui/FunButton'
import { useLogin } from '../../api/auth'

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [shake, setShake] = useState(false)

  const loginMutation = useLogin()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!username.trim() || !password) {
      setErrorMessage('Username dan password wajib diisi.')
      triggerShake()
      return
    }

    try {
      await loginMutation.mutateAsync({
        username: username.trim(),
        password,
        remember,
      })
      navigate('/beranda', { replace: true })
    } catch (err) {
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali kredensial Anda.')
      triggerShake()
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6} lg={5}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <CCardGroup className={shake ? 'animate-shake' : ''}>
                <CCard className="p-4 shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <CCardBody>
                    <CForm onSubmit={handleSubmit}>
                      <div className="text-center mb-4">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                          style={{
                            width: '54px',
                            height: '54px',
                            backgroundColor: 'rgba(31, 95, 91, 0.1)',
                            color: '#1f5f5b',
                          }}
                        >
                          <CIcon icon={cilCheckCircle} size="xl" />
                        </div>
                        <h2 className="fw-bold mb-1" style={{ color: '#1f5f5b' }}>
                          LKB-App
                        </h2>
                        <p className="text-body-secondary small">
                          Laporan Kinerja Bulanan Dosen · UIN Syekh Wasil Kediri
                        </p>
                      </div>

                      {errorMessage && (
                        <CAlert color="danger" className="py-2 small mb-3">
                          {errorMessage}
                        </CAlert>
                      )}

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Username</label>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilUser} />
                          </CInputGroupText>
                          <CFormInput
                            placeholder="Masukkan username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loginMutation.isPending}
                          />
                        </CInputGroup>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Password</label>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilLockLocked} />
                          </CInputGroupText>
                          <CFormInput
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Masukkan password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loginMutation.isPending}
                          />
                          <CButton
                            type="button"
                            variant="outline"
                            color="secondary"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                            }
                          >
                            {showPassword ? '🙈' : '👁'}
                          </CButton>
                        </CInputGroup>
                      </div>

                      <div className="mb-4 d-flex justify-content-between align-items-center">
                        <CFormCheck
                          id="rememberMe"
                          label="Ingat saya 14 hari"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          disabled={loginMutation.isPending}
                          className="small"
                        />
                      </div>

                      <div className="d-grid">
                        <FunButton
                          variant="primary"
                          type="submit"
                          loading={loginMutation.isPending}
                          size="lg"
                          className="py-2"
                        >
                          Masuk
                        </FunButton>
                      </div>
                    </CForm>
                  </CCardBody>
                </CCard>
              </CCardGroup>
            </motion.div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
