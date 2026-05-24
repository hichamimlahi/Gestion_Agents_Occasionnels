import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, roles = [] }) {
  const { t } = useTranslation()
  const { loading, isAuthenticated, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="panel">{t('common.loading')}...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles.length && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
