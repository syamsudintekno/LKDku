import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import RequireSession from './components/RequireSession'
import { MotionProvider } from './motion/useMotionPref'

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
    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, [isColorModeSet, setColorMode, storedTheme])

  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
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
              <Route
                path="*"
                name="Home"
                element={
                  <RequireSession>
                    <DefaultLayout />
                  </RequireSession>
                }
              />
            </Routes>
          </Suspense>
        </HashRouter>
      </MotionProvider>
    </QueryClientProvider>
  )
}

export default App
