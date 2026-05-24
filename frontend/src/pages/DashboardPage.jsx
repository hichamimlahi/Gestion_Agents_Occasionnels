import CandidateDashboardPage from './CandidateDashboardPage'
import RhDashboardPage from './RhDashboardPage'
import PresidentDashboardPage from './PresidentDashboardPage'
import { useAuth } from '../context/AuthContext'

function DashboardPage() {
  const { role } = useAuth()

  if (role === 'rh' || role === 'naib_rh') {
    return <RhDashboardPage />
  }

  if (role === 'president') {
    return <PresidentDashboardPage />
  }

  return <CandidateDashboardPage />
}

export default DashboardPage
