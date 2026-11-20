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
import { cilLockLocked, cilUser, cilCheckCircle, cilInput, cilLockUnlocked } from '@coreui/icons'
import { motion } from 'motion/react'
import { FunButton } from '../../components/ui/FunButton'
import { useLogin } from '../../api/auth'
import { API_URL } from '../../config'
import { useMotionPref } from '../../motion/useMotionPref'
import { DUR, EASE } from '../../motion/tokens'

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { mode, enabled } = useMotionPref()
  const [shakeKey, setShakeKey] = useState(0)

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
    setShakeKey((value) => value + 1)
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6} lg={5}>
            <motion.div
              initial={enabled ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: enabled ? DUR.base : 0, ease: EASE }}
            >
              <CCardGroup>
                <CCard className="p-4 shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <CCardBody>
                    <CForm onSubmit={handleSubmit}>
                      <div className="text-center mb-4">
                        <div
                          className="login-brand d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                          style={{
                            width: '54px',
                            height: '54px',
                            backgroundColor: 'rgba(31, 95, 91, 0.1)',
                          }}
                        >
                          <CIcon icon={cilCheckCircle} size="xl" />
                        </div>
                        <h1 className="login-brand h2 fw-bold mb-1">LKB-App</h1>
                        <p className="text-body-secondary small">
                          Laporan Kinerja Bulanan Dosen · UIN Syekh Wasil Kediri
                        </p>
                      </div>

                      {errorMessage && (
                        <CAlert
                          key={shakeKey}
                          color="danger"
                          role="alert"
                          className={`py-2 small mb-3 ${mode === 'ceria' ? 'animate-shake' : ''}`}
                        >
                          {errorMessage}
                        </CAlert>
                      )}

                      <div className="mb-3">
                        <label htmlFor="login-username" className="form-label small fw-semibold">
                          Username
                        </label>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilUser} />
                          </CInputGroupText>
                          <CFormInput
                            id="login-username"
                            required
                            placeholder="Masukkan username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loginMutation.isPending}
                          />
                        </CInputGroup>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="login-password" className="form-label small fw-semibold">
                          Password
                        </label>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilLockLocked} />
                          </CInputGroupText>
                          <CFormInput
                            id="login-password"
                            required
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
                            <CIcon
                              icon={showPassword ? cilLockLocked : cilLockUnlocked}
                              aria-hidden="true"
                            />
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

                      {!API_URL && (
                        <CAlert color="info" role="status">
                          Layanan belum dikonfigurasi. Hubungkan API sebelum masuk.
                        </CAlert>
                      )}
                      <div className="d-grid">
                        <FunButton
                          variant="primary"
                          type="submit"
                          loading={loginMutation.isPending}
                          disabled={!API_URL}
                          icon={cilInput}
                          size="lg"
                          className="py-2 w-100"
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
