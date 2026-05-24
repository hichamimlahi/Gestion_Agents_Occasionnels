import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { appSwal } from '../lib/alerts'
import { notifyError, notifySuccess } from '../lib/notify'
import { translateServerMessage } from '../lib/i18nHelpers'

const initialState = {
  first_name: '',
  last_name: '',
  cin: '',
  birth_date: '',
  gender: 'male',
  phone: '',
  email: '',
  password: '',
  password_confirmation: '',
}

function calculateAge(dateString) {
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return age
}

function RegisterPage() {
  const { t, i18n } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialState)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')

    const age = calculateAge(form.birth_date)
    if (age <= 18 || age >= 60) {
      const ageMessage = t('auth.errors.invalid_age')
      setError(ageMessage)
      notifyError(ageMessage)

      await appSwal.fire({
        icon: 'error',
        title: t('auth.alerts.invalid_age_title'),
        text: ageMessage,
        confirmButtonText: t('common.understood'),
      })

      setBusy(false)
      return
    }

    try {
      const payload = { ...form, locale: i18n.language === 'ar' ? 'ar' : 'fr' }
      const data = await register(payload)
      const codePreview = data?.verification?.code_preview ?? '------'

      setSuccess(t('auth.messages.account_created_with_code', { code: codePreview }))
      notifySuccess(t('auth.messages.account_created_requires_verification'))
      navigate('/verify', { state: { email: form.email, codePreview } })
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'auth.errors.register_failed',
      )

      setError(message)
      notifyError(message)

      await appSwal.fire({
        icon: 'error',
        title: t('auth.alerts.register_error_title'),
        text: message,
        confirmButtonText: t('common.close'),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>{t('nav.register')}</h1>
      <form onSubmit={onSubmit} className="grid-form">
        <label>
          {t('auth.fields.last_name')}
          <input
            value={form.last_name}
            onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('auth.fields.first_name')}
          <input
            value={form.first_name}
            onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('auth.fields.cin')}
          <input value={form.cin} onChange={(event) => setForm((prev) => ({ ...prev, cin: event.target.value }))} required />
        </label>
        <label>
          {t('auth.fields.birth_date')}
          <input
            type="date"
            value={form.birth_date}
            onChange={(event) => setForm((prev) => ({ ...prev, birth_date: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('auth.fields.gender')}
          <select value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}>
            <option value="male">{t('auth.gender.male')}</option>
            <option value="female">{t('auth.gender.female')}</option>
          </select>
        </label>
        <label>
          {t('auth.fields.phone')}
          <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} required />
        </label>
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
        <label>
          {t('auth.fields.password_confirmation')}
          <input
            type="password"
            value={form.password_confirmation}
            onChange={(event) => setForm((prev) => ({ ...prev, password_confirmation: event.target.value }))}
            required
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p className="success-text">{success}</p> : null}
        <button type="submit" className="btn btn-gold" disabled={busy}>
          {busy ? `${t('common.loading')}...` : t('common.submit')}
        </button>
      </form>
      <p>
        <Link to="/verify">{t('auth.verify_account')}</Link>
      </p>
    </section>
  )
}

export default RegisterPage
