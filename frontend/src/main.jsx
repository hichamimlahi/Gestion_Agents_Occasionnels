import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './context/AuthContext'
import './i18n'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import App from './App.jsx'

function RootApplication() {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return (
    <>
      <App />
      <ToastContainer
        rtl={isArabic}
        position={isArabic ? 'top-left' : 'top-right'}
        autoClose={3200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastClassName="app-toast"
        bodyClassName="app-toast-body"
      />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RootApplication />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
