import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/login/Login'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
})

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('lkb-app-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Suspense
          fallback={
            <div className="pt-5 text-center min-vh-100 d-flex flex-column align-items-center justify-content-center">
              <CSpinner color="primary" variant="grow" />
              <div className="mt-3 text-body-secondary small">Memuat LKB-App...</div>
            </div>
          }
        >
          <Routes>
            <Route path="/login" name="Login Page" element={<Login />} />
            <Route path="/authentication/login" element={<Navigate to="/login" replace />} />
            <Route path="*" name="Home" element={<DefaultLayout />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
