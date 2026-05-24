import { Route, Routes } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ApplicationFormPage from './pages/ApplicationFormPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PresidentDashboardPage from './pages/PresidentDashboardPage'
import PresidentStaffManagementPage from './pages/PresidentStaffManagementPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import RhAdministrativeDocumentsPage from './pages/RhAdministrativeDocumentsPage'
import RhDashboardPage from './pages/RhDashboardPage'
import VerifyCodePage from './pages/VerifyCodePage'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyCodePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/new"
          element={
            <ProtectedRoute roles={['occasionnel']}>
              <ApplicationFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rh/queue"
          element={
            <ProtectedRoute roles={['rh', 'naib_rh']}>
              <RhDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rh/administrative-documents"
          element={
            <ProtectedRoute roles={['rh', 'naib_rh']}>
              <RhAdministrativeDocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/president/pending"
          element={
            <ProtectedRoute roles={['president']}>
              <PresidentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/president/staff"
          element={
            <ProtectedRoute roles={['president']}>
              <PresidentStaffManagementPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
