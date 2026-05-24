import { Outlet, useLocation } from 'react-router-dom'
import { useLayoutEffect, useRef, useState } from 'react'
import Footer from './Footer'
import Navbar from './Navbar'
import PageTransitionLoader from './PageTransitionLoader'
import { setNotificationsSuspended } from '../lib/notify'

function MainLayout() {
  const location = useLocation()
  const [showLoader, setShowLoader] = useState(true)
  const firstRun = useRef(true)

  useLayoutEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
    }

    setNotificationsSuspended(true)
    setShowLoader(true)
    const timer = window.setTimeout(() => {
      setShowLoader(false)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [location.pathname])

  const handleLoaderExitComplete = () => {
    setNotificationsSuspended(false)
  }

  return (
    <div className="app-shell">
      <PageTransitionLoader visible={showLoader} onExitComplete={handleLoaderExitComplete} />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
