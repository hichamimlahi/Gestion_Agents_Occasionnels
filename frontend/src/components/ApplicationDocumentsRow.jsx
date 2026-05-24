import { translateDocumentType } from '../lib/i18nHelpers'

const ORDERED_DOCUMENT_TYPES = ['cin', 'cv', 'lettre_demande', 'photo', 'permis', 'diplome']

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5C6.5 5 2.1 8.4 1 12c1.1 3.6 5.5 7 11 7s9.9-3.4 11-7c-1.1-3.6-5.5-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4L11 12.6V4a1 1 0 0 1 1-1zM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z"
        fill="currentColor"
      />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm7 1.4V9h4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ApplicationDocumentsRow({
  applicationId,
  documents,
  downloadBusyKey,
  onPreview,
  onDownload,
  t,
}) {
  const documentsByType = (documents ?? []).reduce((accumulator, document) => {
    if (document?.document_type && !accumulator[document.document_type]) {
      accumulator[document.document_type] = document
    }
    return accumulator
  }, {})

  return (
    <div className="doc-inline-row">
      {ORDERED_DOCUMENT_TYPES.map((documentType) => {
        const document = documentsByType[documentType]
        const humanLabel = translateDocumentType(t, documentType)
        const previewBusy = downloadBusyKey === `${applicationId}-${document?.id}-preview`
        const downloadBusy = downloadBusyKey === `${applicationId}-${document?.id}-download`

        return (
          <div key={`${applicationId}-${documentType}`} className={`doc-inline-item ${document ? 'is-available' : 'is-missing'}`}>
            <div className="doc-inline-meta">
              <span className="doc-inline-icon">
                <FileIcon />
              </span>
              <span className="doc-inline-label">{t(`documents.short.${documentType}`)}</span>
            </div>

            <div className="doc-inline-actions">
              <button
                type="button"
                className="btn icon-action-btn icon-action-btn-view"
                title={t('documents.view_document')}
                aria-label={t('documents.view_document_named', { name: humanLabel })}
                disabled={!document || previewBusy}
                onClick={() => onPreview(document)}
              >
                <EyeIcon />
              </button>
              <button
                type="button"
                className="btn icon-action-btn icon-action-btn-download"
                title={t('documents.download_document')}
                aria-label={t('documents.download_document_named', { name: humanLabel })}
                disabled={!document || downloadBusy}
                onClick={() => onDownload(document)}
              >
                <DownloadIcon />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ApplicationDocumentsRow
