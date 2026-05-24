import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="panel">
      <h1>404</h1>
      <p>{t('not_found.message')}</p>
      <Link to="/" className="btn btn-gold">
        {t('not_found.back_home')}
      </Link>
    </section>
  )
}

export default NotFoundPage
