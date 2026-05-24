import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-side-logo">
          <img src="/logo-commune-larache-clean.png" alt={t('a11y.commune_logo_clean')} />
        </div>

        <div className="footer-center">
          <h3>{t('brand.title')}</h3>
          <div className="footer-links">
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/applications/new">{t('nav.apply')}</Link>
            <Link to="/login">{t('nav.login')}</Link>
            <Link to="/register">{t('nav.register')}</Link>
          </div>
          <p className="footer-address-title">{t('footer.address_title')}</p>
          <p className="footer-address-line">{t('footer.address_line')}</p>
          <a
            className="footer-map-link"
            href="https://maps.app.goo.gl/kNDTMkvosb1zmvb47"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.maps')}
          </a>
        </div>

        <div className="footer-side-logo">
          <img src="/logo-commune-larache-clean.png" alt={t('a11y.commune_logo_clean')} />
        </div>
      </div>
    </footer>
  )
}

export default Footer
