import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ApplicationDocumentsRow from '../components/ApplicationDocumentsRow'
import api from '../lib/api'
import { appSwal } from '../lib/alerts'
import { fetchPdfBlob, downloadPdfBlob, openPdfBlob } from '../lib/fileTransfer'
import { notifyError, notifyInfo, notifySuccess } from '../lib/notify'
import { translateServerMessage, translateStatus, translateSummaryKey } from '../lib/i18nHelpers'

const STATUS_FILTER_BY_KEY = {
  pending_approvals: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  total_processed: 'all',
}

function getCandidateInitials(user) {
  const first = String(user?.first_name ?? '')
    .trim()
    .charAt(0)
  const last = String(user?.last_name ?? '')
    .trim()
    .charAt(0)
  return `${first}${last}`.toUpperCase() || '--'
}

function PresidentDashboardPage() {
  const { t, i18n } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [pending, setPending] = useState([])
  const [processedPool, setProcessedPool] = useState([])
  const [selectedDashboardFilter, setSelectedDashboardFilter] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [downloadBusyKey, setDownloadBusyKey] = useState('')
  const [candidatePhotoUrls, setCandidatePhotoUrls] = useState({})
  const candidatePhotoUrlsRef = useRef({})

  const releaseCandidatePhotoUrl = useCallback((url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }, [])

  const replaceCandidatePhotoUrls = useCallback(
    (nextPhotoUrls) => {
      Object.values(candidatePhotoUrlsRef.current).forEach((url) => releaseCandidatePhotoUrl(url))
      candidatePhotoUrlsRef.current = nextPhotoUrls
      setCandidatePhotoUrls(nextPhotoUrls)
    },
    [releaseCandidatePhotoUrl],
  )

  const loadCandidatePhotos = useCallback(
    async (applications) => {
      const uniqueUserIds = Array.from(
        new Set(
          applications
            .map((application) => application?.candidate?.user?.id)
            .filter((candidateUserId) => candidateUserId !== null && candidateUserId !== undefined),
        ),
      )

      if (uniqueUserIds.length === 0) {
        replaceCandidatePhotoUrls({})
        return
      }

      const loadedPhotoPairs = await Promise.all(
        uniqueUserIds.map(async (candidateUserId) => {
          try {
            const { data } = await api.get(`/applications/users/${candidateUserId}/photo`, { responseType: 'blob' })
            return [candidateUserId, URL.createObjectURL(data)]
          } catch {
            return [candidateUserId, '']
          }
        }),
      )

      const nextPhotoUrls = Object.fromEntries(loadedPhotoPairs.filter(([, url]) => Boolean(url)))
      replaceCandidatePhotoUrls(nextPhotoUrls)
    },
    [replaceCandidatePhotoUrls],
  )

  const loadData = useCallback(async () => {
    const [summaryResponse, pendingResponse, applicationsResponse] = await Promise.all([
      api.get('/dashboard/summary'),
      api.get('/president/pending'),
      api.get('/applications'),
    ])

    const pendingApplications = pendingResponse.data.applications ?? []
    const allApplications = applicationsResponse.data.applications ?? []
    const processedApplications = allApplications.filter((application) => ['approved', 'rejected'].includes(application.status))

    setSummary(summaryResponse.data.stats)
    setPending(pendingApplications)
    setProcessedPool(processedApplications)
    await loadCandidatePhotos([...pendingApplications, ...processedApplications])
  }, [loadCandidatePhotos])

  useEffect(() => {
    loadData().catch((apiError) => {
      setSummary(null)
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.president.errors.load_pending_failed',
      )
      notifyError(message)
    })
  }, [i18n, loadData, t])

  useEffect(() => {
    return () => {
      Object.values(candidatePhotoUrlsRef.current).forEach((url) => releaseCandidatePhotoUrl(url))
      candidatePhotoUrlsRef.current = {}
    }
  }, [releaseCandidatePhotoUrl])

  const filteredProcessedApplications = useMemo(() => {
    if (!selectedDashboardFilter || selectedDashboardFilter === 'pending') {
      return []
    }

    if (selectedDashboardFilter === 'all') {
      return processedPool
    }

    return processedPool.filter((application) => application.status === selectedDashboardFilter)
  }, [processedPool, selectedDashboardFilter])

  const decide = async (applicationId, decision) => {
    const actionLabel = decision === 'approved' ? t('dashboard.president.actions.approve') : t('dashboard.president.actions.reject')
    const result = await appSwal.fire({
      title: t('dashboard.president.modals.decide_title', { action: actionLabel }),
      input: 'textarea',
      inputLabel: t('dashboard.president.modals.comment_optional'),
      inputPlaceholder: t('dashboard.president.modals.comment_placeholder'),
      inputAttributes: { maxlength: '700' },
      showCancelButton: true,
      confirmButtonText: actionLabel,
      cancelButtonText: t('common.cancel'),
    })

    if (!result.isConfirmed) {
      return
    }

    setBusyId(applicationId)
    try {
      await api.post(`/president/applications/${applicationId}/decide`, { decision, comment: result.value ?? '' })
      if (decision === 'approved') {
        notifySuccess(t('dashboard.president.messages.approved'))
      } else {
        notifyInfo(t('dashboard.president.messages.rejected'))
      }
      await loadData()
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.president.errors.decision_failed',
      )
      notifyError(message)
      await appSwal.fire({
        icon: 'error',
        title: t('dashboard.president.alerts.decision_error_title'),
        text: message,
        confirmButtonText: t('common.close'),
      })
    } finally {
      setBusyId(null)
    }
  }

  const downloadUploadedDocument = async (applicationId, document, mode) => {
    const opKey = `${applicationId}-${document.id}-${mode}`
    setDownloadBusyKey(opKey)
    try {
      const blob = await fetchPdfBlob(`/applications/${applicationId}/documents/${document.id}/download`)
      const documentName = document.original_name || `${document.document_type}.pdf`
      if (mode === 'preview') {
        openPdfBlob(blob)
        notifyInfo(t('documents.previewing', { name: documentName }))
      } else {
        downloadPdfBlob(blob, documentName)
        notifySuccess(t('documents.downloaded', { name: documentName }))
      }
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'documents.download_error',
      )
      notifyError(message)
    } finally {
      setDownloadBusyKey('')
    }
  }

  const processedTableTitle =
    selectedDashboardFilter === 'approved'
      ? t('dashboard.president.processed.accepted_table_title')
      : selectedDashboardFilter === 'rejected'
        ? t('dashboard.president.processed.rejected_table_title')
        : t('dashboard.president.processed.total_table_title')

  const showPendingTable = selectedDashboardFilter === null || selectedDashboardFilter === 'pending'
  const showProcessedTable = selectedDashboardFilter !== null && selectedDashboardFilter !== 'pending'

  return (
    <section className="dashboard-wrap">
      <h1>{t('dashboard.titles.president')}</h1>

      <div className="stats-grid">
        {summary
          ? Object.entries(summary).map(([label, value]) => {
              const filterKey = STATUS_FILTER_BY_KEY[label] ?? null
              const isSelected = filterKey && selectedDashboardFilter === filterKey

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
                  onClick={() => setSelectedDashboardFilter((currentFilter) => (currentFilter === filterKey ? null : filterKey))}
                >
                  <h3>{value}</h3>
                  <p>{translateSummaryKey(t, label)}</p>
                </button>
              )
            })
          : null}
      </div>

      {showProcessedTable ? (
        <div className="panel">
          <h2>{processedTableTitle}</h2>
          <table className="table">
            <thead>
              <tr>
                <th className="staff-photo-column">{t('dashboard.table.photo')}</th>
                <th>{t('dashboard.table.reference')}</th>
                <th>{t('dashboard.table.candidate')}</th>
                <th>{t('dashboard.table.function')}</th>
                <th>{t('dashboard.table.period')}</th>
                <th>{t('dashboard.table.pdf_file')}</th>
                <th>{t('dashboard.table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcessedApplications.map((application) => {
                const candidateUser = application.candidate?.user
                const candidateUserId = candidateUser?.id
                const candidateName = candidateUser?.full_name || t('common.not_available')
                const candidatePhotoUrl = candidateUserId ? candidatePhotoUrls[candidateUserId] : ''

                return (
                  <tr key={`processed-${application.id}`}>
                    <td className="staff-photo-cell">
                      <div className="staff-user-avatar">
                        {candidatePhotoUrl ? (
                          <img src={candidatePhotoUrl} alt={t('profile.photo.alt')} />
                        ) : (
                          <span>{getCandidateInitials(candidateUser)}</span>
                        )}
                      </div>
                    </td>
                    <td>{application.reference}</td>
                    <td>{candidateName}</td>
                    <td>{application.desired_position || t('common.not_available')}</td>
                    <td>{application.season_label || t('common.not_available')}</td>
                    <td>
                      <ApplicationDocumentsRow
                        applicationId={application.id}
                        documents={application.uploaded_documents ?? []}
                        downloadBusyKey={downloadBusyKey}
                        onPreview={(document) => downloadUploadedDocument(application.id, document, 'preview')}
                        onDownload={(document) => downloadUploadedDocument(application.id, document, 'download')}
                        t={t}
                      />
                    </td>
                    <td>
                      <span className={`status status-${application.status}`}>{translateStatus(t, application.status)}</span>
                    </td>
                  </tr>
                )
              })}
              {filteredProcessedApplications.length === 0 ? (
                <tr>
                  <td colSpan={7}>{t('dashboard.president.processed.empty')}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {showPendingTable ? (
        <div className="panel">
          <h2>{t('dashboard.president.pending_files')}</h2>
          <table className="table">
            <thead>
              <tr>
                <th className="staff-photo-column">{t('dashboard.table.photo')}</th>
                <th>{t('dashboard.table.reference')}</th>
                <th>{t('dashboard.table.candidate')}</th>
                <th>{t('dashboard.table.function')}</th>
                <th>{t('dashboard.table.period')}</th>
                <th>{t('dashboard.table.pdf_file')}</th>
                <th>{t('dashboard.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((application) => {
                const candidateUser = application.candidate?.user
                const candidateUserId = candidateUser?.id
                const candidateName = candidateUser?.full_name || t('common.not_available')
                const candidatePhotoUrl = candidateUserId ? candidatePhotoUrls[candidateUserId] : ''

                return (
                  <tr key={application.id}>
                    <td className="staff-photo-cell">
                      <div className="staff-user-avatar">
                        {candidatePhotoUrl ? (
                          <img src={candidatePhotoUrl} alt={t('profile.photo.alt')} />
                        ) : (
                          <span>{getCandidateInitials(candidateUser)}</span>
                        )}
                      </div>
                    </td>
                    <td>{application.reference}</td>
                    <td>{candidateName}</td>
                    <td>{application.desired_position || t('common.not_available')}</td>
                    <td>{application.season_label || t('common.not_available')}</td>
                    <td>
                      <ApplicationDocumentsRow
                        applicationId={application.id}
                        documents={application.uploaded_documents ?? []}
                        downloadBusyKey={downloadBusyKey}
                        onPreview={(document) => downloadUploadedDocument(application.id, document, 'preview')}
                        onDownload={(document) => downloadUploadedDocument(application.id, document, 'download')}
                        t={t}
                      />
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="btn btn-gold"
                          disabled={busyId === application.id}
                          onClick={() => decide(application.id, 'approved')}
                        >
                          {t('dashboard.president.actions.approve')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={busyId === application.id}
                          onClick={() => decide(application.id, 'rejected')}
                        >
                          {t('dashboard.president.actions.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

export default PresidentDashboardPage
