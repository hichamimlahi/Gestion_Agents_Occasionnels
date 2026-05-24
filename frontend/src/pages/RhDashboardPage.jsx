import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'
import ApplicationDocumentsRow from '../components/ApplicationDocumentsRow'
import api from '../lib/api'
import { appSwal } from '../lib/alerts'
import { fetchPdfBlob, downloadPdfBlob, openPdfBlob } from '../lib/fileTransfer'
import { notifyError, notifyInfo, notifySuccess } from '../lib/notify'
import {
  translateServerMessage,
  translateStatus,
  translateSummaryKey,
} from '../lib/i18nHelpers'

const RH_PENDING_STATUSES = ['submitted', 'rh_review', 'on_hold']

function getCandidateInitials(user) {
  const first = String(user?.first_name ?? '')
    .trim()
    .charAt(0)
  const last = String(user?.last_name ?? '')
    .trim()
    .charAt(0)
  return `${first}${last}`.toUpperCase() || '--'
}

function RhDashboardPage() {
  const { t, i18n } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [queue, setQueue] = useState([])
  const [selectedQueueFilter, setSelectedQueueFilter] = useState('pending')
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
    const [summaryResponse, queueResponse] = await Promise.all([api.get('/dashboard/summary'), api.get('/rh/queue')])
    const queueData = queueResponse.data.applications ?? []

    setSummary(summaryResponse.data.stats)
    setQueue(queueData)
    await loadCandidatePhotos(queueData)
  }, [loadCandidatePhotos])

  useEffect(() => {
    loadData().catch((apiError) => {
      setSummary(null)
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.rh.errors.load_queue_failed',
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

  const pendingApplications = useMemo(
    () => queue.filter((application) => RH_PENDING_STATUSES.includes(application.status)),
    [queue],
  )

  const approvedApplications = useMemo(
    () => queue.filter((application) => application.status === 'approved'),
    [queue],
  )

  const presidentReviewApplications = useMemo(
    () => queue.filter((application) => application.status === 'president_review'),
    [queue],
  )

  const rejectedApplications = useMemo(
    () => queue.filter((application) => application.status === 'rejected'),
    [queue],
  )

  const statCards = useMemo(() => {
    if (!summary) {
      return []
    }

    return [
      {
        key: 'submitted',
        filter: 'pending',
        value: pendingApplications.length,
      },
      {
        key: 'president_review',
        filter: 'president_review',
        value: presidentReviewApplications.length,
      },
      {
        key: 'approved',
        filter: 'approved',
        value: approvedApplications.length,
      },
      {
        key: 'rejected',
        filter: 'rejected',
        value: rejectedApplications.length,
      },
      {
        key: 'total_applications',
        filter: 'all',
        value: queue.length,
      },
    ]
  }, [
    summary,
    pendingApplications.length,
    presidentReviewApplications.length,
    approvedApplications.length,
    rejectedApplications.length,
    queue.length,
  ])

  const filteredQueue = useMemo(() => {
    if (selectedQueueFilter === 'president_review') {
      return presidentReviewApplications
    }

    if (selectedQueueFilter === 'approved') {
      return approvedApplications
    }

    if (selectedQueueFilter === 'rejected') {
      return rejectedApplications
    }

    if (selectedQueueFilter === 'all') {
      return queue
    }

    return pendingApplications
  }, [
    selectedQueueFilter,
    presidentReviewApplications,
    approvedApplications,
    rejectedApplications,
    queue,
    pendingApplications,
  ])

  const sendToPresident = async (applicationId) => {
    const confirmation = await appSwal.fire({
      icon: 'question',
      title: t('dashboard.rh.modals.transfer_title'),
      text: t('dashboard.rh.modals.transfer_text'),
      showCancelButton: true,
      confirmButtonText: t('dashboard.rh.actions.confirm_transfer'),
      cancelButtonText: t('common.cancel'),
    })

    if (!confirmation.isConfirmed) {
      return
    }

    setBusyId(applicationId)
    try {
      await api.post(`/rh/applications/${applicationId}/send-to-president`)
      notifyInfo(t('dashboard.rh.messages.sent_to_president'))
      await loadData()
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.rh.errors.transfer_failed',
      )
      notifyError(message)

      await appSwal.fire({
        icon: 'error',
        title: t('dashboard.rh.alerts.transfer_failed_title'),
        text: message,
        confirmButtonText: t('common.close'),
      })
    } finally {
      setBusyId(null)
    }
  }

  const askFinalizePayload = async (decision) => {
    if (decision === 'rejected') {
      const result = await appSwal.fire({
        title: t('dashboard.rh.modals.finalize_reject_title'),
        input: 'textarea',
        inputLabel: t('dashboard.rh.modals.rh_note_optional'),
        inputPlaceholder: t('dashboard.rh.modals.comment_placeholder'),
        inputAttributes: { maxlength: '700' },
        showCancelButton: true,
        confirmButtonText: t('dashboard.rh.actions.confirm_reject'),
        cancelButtonText: t('common.cancel'),
      })

      if (!result.isConfirmed) {
        return null
      }

      return {
        decision,
        final_note: result.value ?? '',
      }
    }

    const result = await appSwal.fire({
      title: t('dashboard.rh.modals.finalize_accept_title'),
      html: `
        <div class="swal-grid-form">
          <label class="swal-label">${t('dashboard.rh.modals.start_date_label')}</label>
          <input id="swal-start-date" class="swal-field" placeholder="2026-06-21" />
          <label class="swal-label">${t('dashboard.rh.modals.end_date_label')}</label>
          <input id="swal-end-date" class="swal-field" placeholder="2026-09-15" />
          <label class="swal-label">${t('dashboard.rh.modals.assignment_location_label')}</label>
          <input id="swal-location" class="swal-field" placeholder="${t('dashboard.rh.modals.assignment_location_placeholder')}" />
          <label class="swal-label">${t('dashboard.rh.modals.assignment_service_label')}</label>
          <input id="swal-function" class="swal-field" placeholder="${t('dashboard.rh.modals.assignment_service_placeholder')}" />
          <label class="swal-label">${t('dashboard.rh.modals.rh_note_optional')}</label>
          <textarea id="swal-note" class="swal-field" placeholder="${t('dashboard.rh.modals.rh_note_placeholder')}"></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: t('dashboard.rh.actions.finalize'),
      cancelButtonText: t('common.cancel'),
      preConfirm: () => {
        const assignedStartDate = document.getElementById('swal-start-date')?.value?.trim()
        const assignedEndDate = document.getElementById('swal-end-date')?.value?.trim()
        const affectationLocation = document.getElementById('swal-location')?.value?.trim()
        const affectationService = document.getElementById('swal-function')?.value?.trim()
        const finalNote = document.getElementById('swal-note')?.value?.trim()

        if (!assignedStartDate || !assignedEndDate || !affectationLocation) {
          Swal.showValidationMessage(t('dashboard.rh.validation.dates_location_required'))
          return null
        }

        return {
          decision,
          final_note: finalNote ?? '',
          assigned_start_date: assignedStartDate,
          assigned_end_date: assignedEndDate,
          affectation_location: affectationLocation,
          affectation_service: affectationService ?? '',
        }
      },
    })

    if (!result.isConfirmed) {
      return null
    }

    return result.value
  }

  const finalize = async (applicationId, decision) => {
    const payload = await askFinalizePayload(decision)
    if (!payload) {
      return
    }

    setBusyId(applicationId)
    try {
      await api.post(`/rh/applications/${applicationId}/finalize`, payload)
      if (decision === 'approved') {
        notifySuccess(t('dashboard.rh.messages.finalized_approved'))
      } else {
        notifyInfo(t('dashboard.rh.messages.finalized_rejected'))
      }
      await loadData()
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.rh.errors.finalize_failed',
      )
      notifyError(message)

      await appSwal.fire({
        icon: 'error',
        title: t('dashboard.rh.alerts.finalize_failed_title'),
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

  return (
    <section className="dashboard-wrap">
      <h1>{t('dashboard.titles.rh')}</h1>
      <div className="stats-grid stats-grid-balanced">
        {statCards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`stat-card stat-card-button ${selectedQueueFilter === card.filter ? 'is-active' : ''}`}
            onClick={() => setSelectedQueueFilter(card.filter)}
          >
            <h3>{card.value}</h3>
            <p>{translateSummaryKey(t, card.key)}</p>
          </button>
        ))}
      </div>

      <div className="panel">
        <h2>{t('dashboard.rh.applications_table_title')}</h2>
        <table className="table">
          <thead>
            <tr>
              <th className="staff-photo-column">{t('dashboard.table.photo')}</th>
              <th>{t('dashboard.table.reference')}</th>
              <th>{t('dashboard.table.candidate')}</th>
              <th>{t('dashboard.table.function')}</th>
              <th>{t('dashboard.table.period')}</th>
              <th>{t('dashboard.table.age')}</th>
              <th>{t('dashboard.table.pdf_file')}</th>
              <th>{t('dashboard.table.status')}</th>
              <th>{t('dashboard.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueue.map((application) => {
              const canSendToPresident = ['submitted', 'rh_review'].includes(application.status)
              const canRhAccept = application.status === 'approved'
              const canRhReject = application.status === 'rejected'
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
                  <td>{application.age_at_submission ?? t('common.not_available')}</td>
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
                  <td>
                    <div className="rh-actions-stack">
                      <button
                        type="button"
                        className="btn btn-outline btn-mini"
                        onClick={() => sendToPresident(application.id)}
                        disabled={busyId === application.id || !canSendToPresident}
                      >
                        {t('dashboard.rh.actions.send_to_president')}
                      </button>
                      <div className="rh-actions-row">
                        <button
                          type="button"
                          className="btn btn-gold btn-mini"
                          onClick={() => finalize(application.id, 'approved')}
                          disabled={busyId === application.id || !canRhAccept}
                        >
                          {t('dashboard.rh.actions.accept')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-mini"
                          onClick={() => finalize(application.id, 'rejected')}
                          disabled={busyId === application.id || !canRhReject}
                        >
                          {t('dashboard.rh.actions.reject')}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredQueue.length === 0 ? (
              <tr>
                <td colSpan={9}>{t('dashboard.president.processed.empty')}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default RhDashboardPage
