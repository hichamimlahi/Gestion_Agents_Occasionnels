import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import { fetchPdfBlob, downloadPdfBlob } from '../lib/fileTransfer'
import { notifyError, notifySuccess } from '../lib/notify'
import {
  translateDocumentType,
  translateNotificationText,
  translateServerMessage,
  translateStatus,
  translateSummaryKey,
} from '../lib/i18nHelpers'

const CANDIDATE_PENDING_STATUSES = ['submitted', 'rh_review', 'president_review']
const FILTER_BY_SUMMARY_KEY = {
  total_applications: 'all',
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
}

function formatApiDate(value) {
  if (!value) {
    return null
  }

  const normalizedDate = String(value).match(/^\d{4}-\d{2}-\d{2}/)
  if (normalizedDate) {
    return normalizedDate[0]
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString().slice(0, 10)
}

function CandidateDashboardPage() {
  const { t, i18n } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [applications, setApplications] = useState([])
  const [documents, setDocuments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [selectedApplicationsFilter, setSelectedApplicationsFilter] = useState('all')
  const [downloadBusyDocumentId, setDownloadBusyDocumentId] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/applications'), api.get('/notifications'), api.get('/documents')])
      .then(([summaryResponse, applicationsResponse, notificationsResponse, documentsResponse]) => {
        setSummary(summaryResponse.data.stats)
        setApplications(applicationsResponse.data.applications ?? [])
        setNotifications(notificationsResponse.data.notifications ?? [])
        setDocuments(documentsResponse.data.documents ?? [])
      })
      .catch((apiError) => {
        setSummary(null)
        const message = translateServerMessage(
          t,
          i18n,
          apiError?.response?.data?.message,
          'dashboard.candidate_documents.errors.load_failed',
        )
        notifyError(message)
      })
  }, [i18n, t])

  const filteredApplications = useMemo(() => {
    if (selectedApplicationsFilter === 'pending') {
      return applications.filter((application) => CANDIDATE_PENDING_STATUSES.includes(application.status))
    }

    if (selectedApplicationsFilter === 'approved') {
      return applications.filter((application) => application.status === 'approved')
    }

    if (selectedApplicationsFilter === 'rejected') {
      return applications.filter((application) => application.status === 'rejected')
    }

    return applications
  }, [applications, selectedApplicationsFilter])

  const dossierSummaryByApplicationId = useMemo(() => {
    const map = {}

    for (const document of documents) {
      if (document?.document_type !== 'dossier_summary') {
        continue
      }

      const applicationId = String(document?.application_id ?? '')
      if (!applicationId || map[applicationId]) {
        continue
      }

      map[applicationId] = document
    }

    return map
  }, [documents])

  const downloadSummaryDocument = async (application) => {
    const summaryDocument = dossierSummaryByApplicationId[String(application.id)]
    if (!summaryDocument) {
      return
    }

    setDownloadBusyDocumentId(summaryDocument.id)
    try {
      const blob = await fetchPdfBlob(`/documents/${summaryDocument.id}/download`)
      const safeReference = String(application.reference || 'dossier').replace(/[^\w.-]+/g, '_')
      downloadPdfBlob(blob, `resume_dossier_${safeReference}.pdf`)
      notifySuccess(
        t('dashboard.candidate_documents.messages.downloaded', {
          name: translateDocumentType(t, summaryDocument.document_type),
        }),
      )
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.candidate_documents.errors.download_failed',
      )
      notifyError(message)
    } finally {
      setDownloadBusyDocumentId(null)
    }
  }

  return (
    <section className="dashboard-wrap">
      <h1>{t('dashboard.titles.occasionnel')}</h1>
      <div className="stats-grid">
        {summary
          ? Object.entries(summary).map(([label, value]) => {
              const filterKey = FILTER_BY_SUMMARY_KEY[label] ?? null
              const isSelected = filterKey && selectedApplicationsFilter === filterKey

              if (!filterKey) {
                return (
                  <article key={label} className="stat-card">
                    <h3>{value}</h3>
                    <p>{translateSummaryKey(t, label)}</p>
                  </article>
                )
              }

              return (
                <button
                  key={label}
                  type="button"
                  className={`stat-card stat-card-button ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setSelectedApplicationsFilter(filterKey)}
                >
                  <h3>{value}</h3>
                  <p>{translateSummaryKey(t, label)}</p>
                </button>
              )
            })
          : null}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{t('dashboard.my_applications')}</h2>
          <Link className="btn btn-gold btn-compact" to="/applications/new">
            {t('dashboard.new_application')}
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{t('dashboard.table.reference')}</th>
              <th>{t('dashboard.table.function')}</th>
              <th>{t('dashboard.table.administrative_period')}</th>
              <th>{t('dashboard.table.period')}</th>
              <th>{t('dashboard.table.status')}</th>
              <th>{t('dashboard.candidate_documents.column_title')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((application) => {
              const summaryDocument = dossierSummaryByApplicationId[String(application.id)]
              const isApproved = application.status === 'approved'
              const isDownloading = Boolean(summaryDocument) && downloadBusyDocumentId === summaryDocument.id

              return (
                <tr key={application.id}>
                  <td>{application.reference}</td>
                  <td>{application.desired_position || t('common.not_available')}</td>
                  <td>{application.season_label || t('common.not_available')}</td>
                  <td>
                    {formatApiDate(application.requested_start_date) || t('common.not_available')} /{' '}
                    {formatApiDate(application.requested_end_date) || t('common.not_available')}
                  </td>
                  <td>
                    <span className={`status status-${application.status}`}>{translateStatus(t, application.status)}</span>
                  </td>
                  <td>
                    {summaryDocument ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-mini"
                        disabled={isDownloading}
                        onClick={() => downloadSummaryDocument(application)}
                      >
                        {isDownloading ? `${t('common.processing')}...` : t('documents.download')}
                      </button>
                    ) : isApproved ? (
                      <span>{t('dashboard.candidate_documents.not_ready')}</span>
                    ) : (
                      <span>{t('common.not_available')}</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={6}>{t('dashboard.president.processed.empty')}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>{t('dashboard.notifications')}</h2>
        <ul className="simple-list">
          {notifications.slice(0, 6).map((notification) => (
            <li key={notification.id}>
              <strong>{translateNotificationText(t, i18n, notification.title, 'title')}</strong>
              <p>{translateNotificationText(t, i18n, notification.body, 'body')}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default CandidateDashboardPage
