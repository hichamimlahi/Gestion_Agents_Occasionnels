import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { appSwal } from '../lib/alerts'
import { notifyError } from '../lib/notify'
import { translateServerMessage } from '../lib/i18nHelpers'

function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const data = await login(form)
      const role = data.user?.role?.slug
      if (role === 'rh' || role === 'naib_rh') {
        navigate('/rh/queue')
        return
      }
      if (role === 'president') {
        navigate('/dashboard')
        return
      }
      navigate('/dashboard')
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'auth.errors.login_failed',
      )
      setError(message)
      notifyError(message)

      await appSwal.fire({
        icon: 'error',
        title: t('auth.alerts.login_error_title'),
        text: message,
        confirmButtonText: t('common.close'),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>{t('nav.login')}</h1>
      <form onSubmit={onSubmit}>
        <label>
          {t('auth.fields.email')}
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('auth.fields.password')}
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="btn btn-gold" disabled={busy}>
          {busy ? `${t('common.loading')}...` : t('common.submit')}
        </button>
      </form>
    </section>
  )
}

export default LoginPage
