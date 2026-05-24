import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { appSwal } from '../lib/alerts'
import { notifyError, notifyInfo, notifySuccess } from '../lib/notify'
import { translateServerMessage } from '../lib/i18nHelpers'

function VerifyCodePage() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyCode, resendCode } = useAuth()
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [codePreview, setCodePreview] = useState(location.state?.codePreview ?? '')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')

    try {
      const data = await verifyCode({ email, code })
      const successMessage = translateServerMessage(
        t,
        i18n,
        data?.message,
        'auth.messages.account_verified_success',
      )

      setMessage(successMessage)
      notifySuccess(t('auth.messages.account_verified_success'))
      navigate('/login')
    } catch (apiError) {
      const messageText = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'auth.errors.verify_failed',
      )

      setError(messageText)
      notifyError(messageText)

      await appSwal.fire({
        icon: 'error',
        title: t('auth.alerts.verify_error_title'),
        text: messageText,
        confirmButtonText: t('common.close'),
      })
    } finally {
      setBusy(false)
    }
  }

  const onResend = async () => {
    if (!email) {
      const requiredEmailMessage = t('auth.errors.email_required')
      setError(requiredEmailMessage)
      notifyError(requiredEmailMessage)
      return
    }

    setResending(true)
    setMessage('')
    setError('')

    try {
      const data = await resendCode({ email })
      setCodePreview(data?.verification?.code_preview ?? '')
      const successMessage = translateServerMessage(t, i18n, data?.message, 'auth.messages.new_code_sent')
      setMessage(successMessage)
      notifyInfo(successMessage)
    } catch (apiError) {
      const messageText = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'auth.errors.resend_failed',
      )
      setError(messageText)
      notifyError(messageText)
    } finally {
      setResending(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>{t('auth.verify_account')}</h1>
      <form onSubmit={onSubmit}>
        <label>
          {t('auth.fields.email')}
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          {t('auth.fields.code')}
          <input value={code} onChange={(event) => setCode(event.target.value)} required />
        </label>
        {codePreview ? <p className="success-text">{t('auth.messages.current_code', { code: codePreview })}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {message ? <p className="success-text">{message}</p> : null}
        <div className="actions-cell">
          <button type="submit" className="btn btn-gold" disabled={busy}>
            {busy ? `${t('common.loading')}...` : t('common.submit')}
          </button>
          <button type="button" className="btn btn-outline" onClick={onResend} disabled={resending}>
            {resending ? `${t('common.loading')}...` : t('auth.actions.resend_code')}
          </button>
        </div>
      </form>
    </section>
  )
}

export default VerifyCodePage
