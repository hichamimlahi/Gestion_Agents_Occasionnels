import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { translateServerMessage } from '../lib/i18nHelpers'
import { notifyError, notifySuccess } from '../lib/notify'

const initialFormState = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  address: '',
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
}

function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { refreshMe } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialFormState)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [removePhotoRequested, setRemovePhotoRequested] = useState(false)

  const releaseBlobUrl = useCallback((url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }, [])

  const resetPhotoPreview = useCallback(() => {
    setPhotoPreviewUrl((previousUrl) => {
      releaseBlobUrl(previousUrl)
      return ''
    })
    setPhotoFile(null)
  }, [releaseBlobUrl])

  const setServerPhotoUrl = useCallback(
    (nextUrl) => {
      setPhotoUrl((previousUrl) => {
        releaseBlobUrl(previousUrl)
        return nextUrl
      })
    },
    [releaseBlobUrl],
  )

  const loadPhoto = useCallback(async () => {
    try {
      const response = await api.get('/profile/photo', {
        params: { ts: Date.now() },
        responseType: 'blob',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const nextUrl = URL.createObjectURL(response.data)
      setServerPhotoUrl(nextUrl)
    } catch {
      setServerPhotoUrl('')
    }
  }, [setServerPhotoUrl])

  const applyUserToForm = useCallback((user) => {
    setForm((previous) => ({
      ...previous,
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      address: user?.address ?? '',
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    }))
  }, [])

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/profile')
      applyUserToForm(data?.user)
      setRemovePhotoRequested(false)

      if (data?.has_profile_photo) {
        await loadPhoto()
      } else {
        setServerPhotoUrl('')
      }
    } catch (apiError) {
      const message = translateServerMessage(t, i18n, apiError?.response?.data?.message, 'profile.errors.load_failed')
      notifyError(message)
    } finally {
      setLoading(false)
    }
  }, [applyUserToForm, i18n, loadPhoto, setServerPhotoUrl, t])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    return () => {
      releaseBlobUrl(photoUrl)
      releaseBlobUrl(photoPreviewUrl)
    }
  }, [photoPreviewUrl, photoUrl, releaseBlobUrl])

  const displayedPhoto = photoPreviewUrl || photoUrl
  const initials = useMemo(() => {
    const first = form.first_name?.trim()?.charAt(0) ?? ''
    const last = form.last_name?.trim()?.charAt(0) ?? ''
    return `${first}${last}`.toUpperCase() || '??'
  }, [form.first_name, form.last_name])

  const onPhotoChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null
    setPhotoFile(selectedFile)
    if (selectedFile) {
      setRemovePhotoRequested(false)
    }

    setPhotoPreviewUrl((previousUrl) => {
      releaseBlobUrl(previousUrl)
      if (!selectedFile) {
        return ''
      }
      return URL.createObjectURL(selectedFile)
    })
  }

  const removeStoredPhoto = () => {
    resetPhotoPreview()
    setServerPhotoUrl('')
    setRemovePhotoRequested(true)
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = new FormData()
      payload.append('first_name', form.first_name.trim())
      payload.append('last_name', form.last_name.trim())
      payload.append('phone', form.phone.trim())
      payload.append('email', form.email.trim())
      payload.append('address', form.address.trim())

      if (form.current_password) {
        payload.append('current_password', form.current_password)
      }

      if (form.new_password) {
        payload.append('new_password', form.new_password)
        payload.append('new_password_confirmation', form.new_password_confirmation)
      }

      if (removePhotoRequested && !photoFile) {
        payload.append('remove_profile_photo', '1')
      }

      if (photoFile) {
        payload.append('profile_photo', photoFile)
      }

      const { data } = await api.post('/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      applyUserToForm(data?.user)
      resetPhotoPreview()
      setRemovePhotoRequested(false)

      if (data?.has_profile_photo) {
        await loadPhoto()
      } else {
        setServerPhotoUrl('')
      }

      await refreshMe()

      const message = translateServerMessage(t, i18n, data?.message, 'profile.messages.updated')
      notifySuccess(message)
    } catch (apiError) {
      const message = translateServerMessage(t, i18n, apiError?.response?.data?.message, 'profile.errors.update_failed')
      notifyError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="dashboard-wrap">
      <h1>{t('profile.title')}</h1>
      <p className="form-intro">{t('profile.subtitle')}</p>

      {loading ? <p>{`${t('common.loading')}...`}</p> : null}

      {!loading ? (
        <div className="profile-grid">
          <article className="panel profile-photo-panel">
            <h2>{t('profile.sections.photo')}</h2>
            <div className="profile-avatar">
              {displayedPhoto ? (
                <img src={displayedPhoto} alt={t('profile.photo.alt')} />
              ) : (
                <span className="profile-avatar-fallback">{initials}</span>
              )}
            </div>
            <p className="profile-photo-help">{t('profile.photo.help')}</p>
            {!displayedPhoto ? <p className="profile-photo-empty">{t('profile.photo.no_photo')}</p> : null}
            <label>
              {t('profile.photo.field_label')}
              <input
                className="file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/*"
                onChange={onPhotoChange}
              />
            </label>
            {photoFile ? <p className="profile-file-name">{t('profile.photo.selected_file', { name: photoFile.name })}</p> : null}
            {photoPreviewUrl ? (
              <button type="button" className="btn btn-outline btn-compact" onClick={resetPhotoPreview}>
                {t('profile.photo.remove_selection')}
              </button>
            ) : null}
            {!photoPreviewUrl && displayedPhoto ? (
              <button type="button" className="btn btn-danger btn-compact" onClick={removeStoredPhoto}>
                {t('profile.photo.remove_profile')}
              </button>
            ) : null}
            {removePhotoRequested ? <p className="profile-file-name">{t('profile.photo.remove_pending')}</p> : null}
          </article>

          <form className="panel profile-form-panel" onSubmit={onSubmit}>
            <h2>{t('profile.sections.personal')}</h2>
            <div className="form-grid-3">
              <label>
                {t('auth.fields.first_name')}
                <input
                  value={form.first_name}
                  onChange={(event) => setForm((previous) => ({ ...previous, first_name: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('auth.fields.last_name')}
                <input
                  value={form.last_name}
                  onChange={(event) => setForm((previous) => ({ ...previous, last_name: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('auth.fields.phone')}
                <input
                  value={form.phone}
                  onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('auth.fields.email')}
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                  required
                />
              </label>
              <label className="profile-field-full">
                {t('profile.fields.address')}
                <input
                  value={form.address}
                  onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value }))}
                />
              </label>
            </div>

            <div className="form-section">
              <h2>{t('profile.sections.password')}</h2>
              <div className="form-grid-3">
                <label>
                  {t('profile.fields.current_password')}
                  <input
                    type="password"
                    value={form.current_password}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, current_password: event.target.value }))
                    }
                  />
                </label>
                <label>
                  {t('profile.fields.new_password')}
                  <input
                    type="password"
                    value={form.new_password}
                    onChange={(event) => setForm((previous) => ({ ...previous, new_password: event.target.value }))}
                  />
                </label>
                <label>
                  {t('profile.fields.new_password_confirmation')}
                  <input
                    type="password"
                    value={form.new_password_confirmation}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, new_password_confirmation: event.target.value }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? `${t('common.processing')}...` : t('profile.actions.save')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default ProfilePage
