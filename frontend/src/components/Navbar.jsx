import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { t } = useTranslation()
  const { isAuthenticated, role, logout } = useAuth()
  const [isCompact, setIsCompact] = useState(false)
  const canSeeApplyLink = !isAuthenticated
  const dashboardLabel = role === 'occasionnel' ? t('dashboard.my_applications') : t('nav.dashboard')

  useEffect(() => {
    const updateCompactMode = () => {
      const shouldCompact = window.scrollY > 22 && window.innerWidth > 1024
      setIsCompact((previous) => (previous === shouldCompact ? previous : shouldCompact))
    }

    updateCompactMode()
    window.addEventListener('scroll', updateCompactMode, { passive: true })
    window.addEventListener('resize', updateCompactMode)

    return () => {
      window.removeEventListener('scroll', updateCompactMode)
      window.removeEventListener('resize', updateCompactMode)
    }
  }, [])

  const pageLinks = (
    <>
      <NavLink to="/">{t('nav.home')}</NavLink>
      {canSeeApplyLink ? <NavLink to="/applications/new">{t('nav.apply')}</NavLink> : null}
      {isAuthenticated && <NavLink to="/dashboard">{dashboardLabel}</NavLink>}
      {isAuthenticated && <NavLink to="/profile">{t('nav.profile')}</NavLink>}
      {role === 'rh' || role === 'naib_rh' ? <NavLink to="/rh/administrative-documents">{t('nav.rh_admin_documents')}</NavLink> : null}
      {role === 'president' ? <NavLink to="/president/staff">{t('nav.president_staff')}</NavLink> : null}
    </>
  )

  return (
    <header className={`site-header ${isCompact ? 'is-compact' : ''}`}>
      <div className="site-header-inner">
        {!isCompact ? (
          <Link to="/" className="brand">
            <img src="/logo-commune-larache-clean.png" alt={t('a11y.commune_logo_clean')} />
            <div>
              <strong>{t('brand.title')}</strong>
              <span>{t('brand.commune')}</span>
            </div>
          </Link>
        ) : null}

        <nav className="menu">{pageLinks}</nav>

        {!isCompact ? (
          <div className="nav-actions">
            <LanguageSwitcher />
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-outline">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-menu-style">
                  {t('nav.register')}
                </Link>
              </>
            ) : (
              <button type="button" className="btn btn-outline btn-logout" onClick={logout}>
                {t('nav.logout')}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default Navbar
