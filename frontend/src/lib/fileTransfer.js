import api from './api'

export async function fetchPdfBlob(url) {
  const response = await api.get(url, { responseType: 'blob' })
  return response.data
}

export function openPdfBlob(blob) {
  const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  window.open(blobUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000)
}

export function downloadPdfBlob(blob, filename) {
  const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5_000)
}
