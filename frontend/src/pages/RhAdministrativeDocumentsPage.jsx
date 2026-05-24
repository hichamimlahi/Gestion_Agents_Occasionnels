import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import { fetchPdfBlob, downloadPdfBlob } from '../lib/fileTransfer'
import { notifyError, notifySuccess } from '../lib/notify'
import { translateDocumentType, translateServerMessage } from '../lib/i18nHelpers'

const ADMIN_DOCUMENT_TYPES = ['affectation', 'prise_service', 'decision', 'engagement', 'dossier_summary']

function RhAdministrativeDocumentsPage() {
  const { t, i18n } = useTranslation()
  const [applications, setApplications] = useState([])
  const [documents, setDocuments] = useState([])
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [busyKey, setBusyKey] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [applicationsResponse, documentsResponse] = await Promise.all([
        api.get('/applications'),
        api.get('/documents'),
      ])

      const fetchedApplications = (applicationsResponse.data.applications ?? []).filter(
        (application) => Boolean(application?.candidate?.user),
      )

      setApplications(fetchedApplications)
      setDocuments(documentsResponse.data.documents ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData().catch((apiError) => {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.rh.admin_documents.errors.load_failed',
      )
      notifyError(message)
    })
  }, [])

  const candidateOptions = useMemo(() => {
    const uniqueCandidates = new Map()

    for (const application of applications) {
      const candidateId = String(application.candidate_id ?? application.candidate?.id ?? '')
      if (!candidateId || uniqueCandidates.has(candidateId)) {
        continue
      }

      uniqueCandidates.set(candidateId, {
        id: candidateId,
        fullName: application.candidate?.user?.full_name || t('common.not_available'),
      })
    }

    return Array.from(uniqueCandidates.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [applications, t])

  useEffect(() => {
    if (candidateOptions.length === 0) {
      setSelectedCandidateId('')
      return
    }

    if (!candidateOptions.some((candidate) => candidate.id === selectedCandidateId)) {
      setSelectedCandidateId(candidateOptions[0].id)
    }
  }, [candidateOptions, selectedCandidateId])

  const applicationsForCandidate = useMemo(() => {
    if (!selectedCandidateId) {
      return []
    }

    return applications
      .filter((application) => String(application.candidate_id ?? application.candidate?.id ?? '') === selectedCandidateId)
      .sort((first, second) => second.id - first.id)
  }, [applications, selectedCandidateId])

  useEffect(() => {
    if (applicationsForCandidate.length === 0) {
      setSelectedApplicationId('')
      return
    }

    const hasCurrentSelection = applicationsForCandidate.some(
      (application) => String(application.id) === selectedApplicationId,
    )

    if (!hasCurrentSelection) {
      setSelectedApplicationId(String(applicationsForCandidate[0].id))
    }
  }, [applicationsForCandidate, selectedApplicationId])

  const selectedApplication = useMemo(
    () => applicationsForCandidate.find((application) => String(application.id) === selectedApplicationId) ?? null,
    [applicationsForCandidate, selectedApplicationId],
  )

  const documentsByType = useMemo(() => {
    if (!selectedApplicationId) {
      return {}
    }

    return documents
      .filter((document) => String(document.application_id) === selectedApplicationId)
      .reduce((accumulator, document) => {
        if (!accumulator[document.document_type]) {
          accumulator[document.document_type] = document
        }
        return accumulator
      }, {})
  }, [documents, selectedApplicationId])

  const handleGenerate = async (documentType) => {
    if (!selectedApplicationId) {
      return
    }

    const currentBusyKey = `generate-${selectedApplicationId}-${documentType}`
    setBusyKey(currentBusyKey)

    try {
      await api.post(`/documents/${selectedApplicationId}/generate`, {
        document_type: documentType,
      })

      notifySuccess(
        t('dashboard.rh.admin_documents.messages.generated', {
          name: translateDocumentType(t, documentType),
        }),
      )

      await loadData()
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.rh.admin_documents.errors.generate_failed',
      )
      notifyError(message)
    } finally {
      setBusyKey('')
    }
  }

  const handleDownload = async (documentType) => {
    const document = documentsByType[documentType]
    if (!document) {
      return
    }

    const currentBusyKey = `download-${document.id}`
    setBusyKey(currentBusyKey)

    try {
      const blob = await fetchPdfBlob(`/documents/${document.id}/download`)
      const safeReference = selectedApplication?.reference || 'document'
      downloadPdfBlob(blob, `${documentType}_${safeReference}.pdf`)
      notifySuccess(
        t('dashboard.rh.admin_documents.messages.downloaded', {
          name: translateDocumentType(t, documentType),
        }),
      )
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.rh.admin_documents.errors.download_failed',
      )
      notifyError(message)
    } finally {
      setBusyKey('')
    }
  }

  return (
    <section className="dashboard-wrap">
      <h1>{t('dashboard.rh.admin_documents.title')}</h1>

      <div className="panel">
        <h2>{t('dashboard.rh.admin_documents.subtitle')}</h2>

        <div className="admin-docs-filters">
          <label>
            {t('dashboard.rh.admin_documents.filters.candidate')}
            <select
              value={selectedCandidateId}
              onChange={(event) => setSelectedCandidateId(event.target.value)}
              disabled={candidateOptions.length === 0}
            >
              {candidateOptions.length === 0 ? (
                <option value="">{t('dashboard.rh.admin_documents.empty_candidates')}</option>
              ) : (
                candidateOptions.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName}
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            {t('dashboard.rh.admin_documents.filters.application')}
            <select
              value={selectedApplicationId}
              onChange={(event) => setSelectedApplicationId(event.target.value)}
              disabled={applicationsForCandidate.length === 0}
            >
              {applicationsForCandidate.length === 0 ? (
                <option value="">{t('dashboard.rh.admin_documents.empty_applications')}</option>
              ) : (
                applicationsForCandidate.map((application) => (
                  <option key={application.id} value={String(application.id)}>
                    {application.reference} - {application.desired_position || t('common.not_available')}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        {loading ? <p>{t('common.loading')}...</p> : null}

        <div className="admin-docs-grid">
          {ADMIN_DOCUMENT_TYPES.map((documentType) => {
            const document = documentsByType[documentType]
            const isGenerating = busyKey === `generate-${selectedApplicationId}-${documentType}`
            const isDownloading = document && busyKey === `download-${document.id}`

            return (
              <article key={documentType} className="admin-doc-card">
                <h3>{translateDocumentType(t, documentType)}</h3>
                <p className="admin-doc-status">
                  {document
                    ? t('dashboard.rh.admin_documents.status.generated')
                    : t('dashboard.rh.admin_documents.status.not_generated')}
                </p>
                <div className="actions-cell">
                  <button
                    type="button"
                    className="btn btn-outline btn-mini"
                    disabled={!selectedApplicationId || isGenerating || loading}
                    onClick={() => handleGenerate(documentType)}
                  >
                    {document
                      ? t('dashboard.rh.admin_documents.actions.regenerate')
                      : t('dashboard.rh.admin_documents.actions.generate')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-gold btn-mini"
                    disabled={!document || isDownloading}
                    onClick={() => handleDownload(documentType)}
                  >
                    {t('documents.download')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default RhAdministrativeDocumentsPage
