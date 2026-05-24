import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

function HomePage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const [payload, setPayload] = useState(null)
  const mapSearchUrl = 'https://maps.app.goo.gl/kNDTMkvosb1zmvb47'
  const mapEmbedUrl = 'https://www.google.com/maps?q=35.1688074,-6.1424927&z=17&output=embed'

  const steps = useMemo(() => t('home.steps.items', { returnObjects: true }), [t])
  const faqItems = useMemo(() => t('home.faq.items', { returnObjects: true }), [t])
  const legalDocumentCards = useMemo(
    () => [
      {
        title: t('home.legal_documents.loi_113_14'),
        versions: [
          {
            langLabel: t('home.legal_documents.languages.fr'),
            href: '/legal-documents/loi-11314-fr.pdf',
          },
          {
            langLabel: t('home.legal_documents.languages.ar'),
            href: '/legal-documents/loi-11314-ar.pdf',
          },
        ],
      },
      {
        title: t('home.legal_documents.bulletin_officiel'),
        versions: [
          {
            langLabel: t('home.legal_documents.languages.fr'),
            href: '/legal-documents/bulletin-officiel-fr.pdf',
          },
          {
            langLabel: t('home.legal_documents.languages.ar'),
            href: '/legal-documents/bulletin-officiel-ar.pdf',
          },
        ],
      },
      {
        title: t('home.legal_documents.fp31'),
        versions: [
          {
            langLabel: t('home.legal_documents.languages.fr'),
            href: '/legal-documents/fonction-publique-fr.pdf',
          },
        ],
      },
    ],
    [t],
  )

  useEffect(() => {
    api
      .get('/public/home')
      .then((response) => setPayload(response.data))
      .catch(() => setPayload(null))
  }, [])

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-overlay">
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {t('home.hero.title')}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }}>
            {t('home.hero.subtitle')}
          </motion.p>
          {!isAuthenticated ? (
            <div className="hero-actions">
              <Link className="btn btn-gold" to="/applications/new">
                {t('home.cta.apply')}
              </Link>
              <Link className="btn btn-outline" to="/login">
                {t('home.cta.login')}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="content-panels">
        <article className="panel">
          <h2>{t('home.steps.title')}</h2>
          <ol>
            {Array.isArray(steps)
              ? steps.map((item) => (
                  <li key={item}>{item}</li>
                ))
              : null}
          </ol>
        </article>

        <article className="panel">
          <h2>{t('home.faq.title')}</h2>
          <div className="faq-list">
            {Array.isArray(faqItems)
              ? faqItems.map((item) => (
                  <div key={item.q} className="faq-item">
                    <h4>{item.q}</h4>
                    <p>{item.a}</p>
                  </div>
                ))
              : null}
          </div>
        </article>
      </section>

      <section className="panel map-section">
        <h2>{t('home.map.title')}</h2>
        <p>{t('home.map.text')}</p>
        <div className="map-frame-wrap">
          <iframe
            title={t('home.map.iframe_title')}
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <a
          className="map-link"
          href={mapSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('home.map.open_link')}
        </a>
      </section>

      <section className="panel legal-docs">
        <h2>{t('home.legal_documents.title')}</h2>
        <p>{t('home.legal_documents.subtitle')}</p>
        <div className="legal-docs-grid">
          {legalDocumentCards.map((document) => (
            <article key={document.title} className="legal-doc-card">
              <h3>{document.title}</h3>
              <p>{t('home.legal_documents.pending_text')}</p>
              <div className="legal-doc-actions">
                {document.versions.map((version) => (
                  <a
                    key={`${document.title}-${version.langLabel}`}
                    className="btn btn-outline btn-compact"
                    href={version.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    {t('home.legal_documents.download_lang', { lang: version.langLabel })}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel admin-info">
        <h2>{t('home.admin.title')}</h2>
        <p>
          {t('home.admin.period_info', {
            start: payload?.summer_season?.start_date || '-',
            end: payload?.summer_season?.end_date || '-',
            days: payload?.summer_season?.approx_worked_days ?? '-',
          })}
        </p>
      </section>
    </div>
  )
}

export default HomePage
