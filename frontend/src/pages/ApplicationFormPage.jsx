import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import { appSwal } from '../lib/alerts'
import { notifyError, notifySuccess } from '../lib/notify'
import { translateDocumentType, translateServerMessage } from '../lib/i18nHelpers'
import { getAdministrativePeriods2026 } from '../lib/administrativePeriods2026'

const requiredTypes = ['cin', 'cv', 'lettre_demande', 'photo']
const optionalTypes = ['permis', 'diplome']

function ApplicationFormPage() {
  const { t, i18n } = useTranslation()
  const [desiredPosition, setDesiredPosition] = useState('')
  const [periodLabel, setPeriodLabel] = useState('')
  const [files, setFiles] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const requiredMissing = useMemo(() => requiredTypes.filter((type) => !files[type]), [files])
  const administrativePeriods = useMemo(() => getAdministrativePeriods2026(t), [t])

  const onFileChange = (type, file) => {
    setFiles((prev) => ({ ...prev, [type]: file }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')

    if (requiredMissing.length > 0) {
      const missingDocuments = requiredMissing.map((type) => translateDocumentType(t, type)).join(', ')
      const missingMessage = t('application_form.errors.missing_required_documents', { documents: missingDocuments })
      setError(missingMessage)
      notifyError(missingMessage)
      setBusy(false)
      return
    }

    try {
      const createResponse = await api.post('/applications', {
        desired_position: desiredPosition,
        season_label: periodLabel,
      })

      const applicationId = createResponse.data.application.id

      for (const [documentType, file] of Object.entries(files)) {
        if (!file) continue
        const formData = new FormData()
        formData.append('document_type', documentType)
        formData.append('file', file)
        await api.post(`/applications/${applicationId}/upload-document`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      await api.post(`/applications/${applicationId}/submit`)
      setMessage(t('application_form.messages.submitted_successfully'))
      notifySuccess(t('application_form.messages.created_and_submitted'))
      setDesiredPosition('')
      setPeriodLabel('')
      setFiles({})
    } catch (apiError) {
      const messageText = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'application_form.errors.submit_failed',
      )

      setError(messageText)
      notifyError(messageText)

      await appSwal.fire({
        icon: 'error',
        title: t('application_form.alerts.submit_failed_title'),
        text: messageText,
        confirmButtonText: t('common.close'),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel form-panel">
      <h1>{t('application_form.title')}</h1>
      <p className="form-intro">{t('application_form.intro')}</p>

      <form onSubmit={onSubmit} className="application-form">
        <div className="form-section">
          <h2>{t('application_form.request_section_title')}</h2>
          <div className="form-grid-3">
            <label>
              {t('application_form.fields.function')}
              <input
                placeholder={t('application_form.placeholders.function')}
                value={desiredPosition}
                onChange={(event) => setDesiredPosition(event.target.value)}
                required
              />
            </label>
            <label>
              {t('application_form.fields.period')}
              <select
                value={periodLabel}
                onChange={(event) => setPeriodLabel(event.target.value)}
                required
              >
                <option value="">{t('application_form.periods.select_placeholder')}</option>
                {administrativePeriods.map((period) => (
                  <option key={period.id} value={period.seasonLabel}>
                    {period.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="form-note">{t('application_form.notes.admin_sets_dates')}</p>
        </div>

        <div className="form-section">
          <h2>{t('application_form.documents_section_title')}</h2>
          <div className="docs-grid">
            {requiredTypes.map((type) => (
              <label key={type} className="doc-card">
                <span>
                  {translateDocumentType(t, type)} *
                </span>
                <input
                  className="file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => onFileChange(type, event.target.files?.[0])}
                  required
                />
                {files[type]?.name ? <small className="file-name">{files[type].name}</small> : null}
              </label>
            ))}

            {optionalTypes.map((type) => (
              <label key={type} className="doc-card">
                <span>{translateDocumentType(t, type)}</span>
                <input
                  className="file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => onFileChange(type, event.target.files?.[0])}
                />
                {files[type]?.name ? <small className="file-name">{files[type].name}</small> : null}
              </label>
            ))}
          </div>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {message ? <p className="success-text">{message}</p> : null}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setDesiredPosition('')
              setPeriodLabel('')
              setFiles({})
              setError('')
              setMessage('')
            }}
            disabled={busy}
          >
            {t('application_form.actions.reset')}
          </button>
          <button type="submit" className="btn btn-gold" disabled={busy}>
            {busy ? `${t('common.processing')}...` : t('application_form.actions.submit_request')}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ApplicationFormPage
