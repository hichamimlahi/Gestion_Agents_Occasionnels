import { useCallback, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import { appSwal } from '../lib/alerts'
import { notifyError, notifySuccess } from '../lib/notify'
import { translateRole, translateServerMessage } from '../lib/i18nHelpers'

function escapeHtmlValue(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function normalizeDateValue(value) {
  const rawValue = String(value ?? '').trim()
  if (!rawValue) {
    return ''
  }

  const match = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }

  const parsedDate = new Date(rawValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const year = parsedDate.getUTCFullYear()
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatBirthDate(value, language, fallback) {
  const normalizedDate = normalizeDateValue(value)
  if (!normalizedDate) {
    return fallback
  }

  const [year, month, day] = normalizedDate.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day))
  const locale = String(language ?? '').startsWith('ar') ? 'ar-MA' : 'fr-FR'
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(utcDate)
}

function getUserInitials(user) {
  const first = String(user?.first_name ?? '')
    .trim()
    .charAt(0)
  const last = String(user?.last_name ?? '')
    .trim()
    .charAt(0)

  return `${first}${last}`.toUpperCase() || '--'
}

function PresidentStaffManagementPage() {
  const { t, i18n } = useTranslation()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [staffPhotoUrls, setStaffPhotoUrls] = useState({})
  const staffPhotoUrlsRef = useRef({})

  const releasePhotoUrl = useCallback((url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }, [])

  const replaceStaffPhotoUrls = useCallback(
    (nextPhotoUrls) => {
      Object.values(staffPhotoUrlsRef.current).forEach((url) => releasePhotoUrl(url))
      staffPhotoUrlsRef.current = nextPhotoUrls
      setStaffPhotoUrls(nextPhotoUrls)
    },
    [releasePhotoUrl],
  )

  const loadStaffPhotos = useCallback(
    async (staffList) => {
      if (!Array.isArray(staffList) || staffList.length === 0) {
        replaceStaffPhotoUrls({})
        return
      }

      const loadedPhotoPairs = await Promise.all(
        staffList.map(async (user) => {
          try {
            const { data } = await api.get(`/president/staff/${user.id}/photo`, { responseType: 'blob' })
            return [user.id, URL.createObjectURL(data)]
          } catch {
            return [user.id, '']
          }
        }),
      )

      const nextPhotoUrls = Object.fromEntries(loadedPhotoPairs.filter(([, url]) => Boolean(url)))
      replaceStaffPhotoUrls(nextPhotoUrls)
    },
    [replaceStaffPhotoUrls],
  )

  const loadStaff = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/president/staff')
      const staffList = data.staff ?? []
      setStaff(staffList)
      await loadStaffPhotos(staffList)
    } finally {
      setLoading(false)
    }
  }, [loadStaffPhotos])

  useEffect(() => {
    loadStaff().catch((apiError) => {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.president.staff.errors.load_failed',
      )
      notifyError(message)
    })
  }, [i18n, loadStaff, t])

  useEffect(() => {
    return () => {
      Object.values(staffPhotoUrlsRef.current).forEach((url) => releasePhotoUrl(url))
      staffPhotoUrlsRef.current = {}
    }
  }, [releasePhotoUrl])

  const askStaffPayload = async (mode, currentUser = null) => {
    const isEdit = mode === 'edit'

    const result = await appSwal.fire({
      title: isEdit ? t('dashboard.president.staff.modals.edit_title') : t('dashboard.president.staff.modals.add_title'),
      html: `
        <div class="swal-grid-form">
          <label class="swal-label">${t('auth.fields.last_name')}</label>
          <input id="swal-last-name" class="swal-field" value="${escapeHtmlValue(currentUser?.last_name)}" />
          <label class="swal-label">${t('auth.fields.first_name')}</label>
          <input id="swal-first-name" class="swal-field" value="${escapeHtmlValue(currentUser?.first_name)}" />
          <label class="swal-label">${t('auth.fields.cin')}</label>
          <input id="swal-cin" class="swal-field" value="${escapeHtmlValue(currentUser?.cin)}" />
          <label class="swal-label">${t('auth.fields.birth_date')}</label>
          <input id="swal-birth-date" class="swal-field" type="date" value="${escapeHtmlValue(normalizeDateValue(currentUser?.birth_date))}" />
          <label class="swal-label">${t('auth.fields.gender')}</label>
          <select id="swal-gender" class="swal-field">
            <option value="male" ${currentUser?.gender === 'male' ? 'selected' : ''}>${t('auth.gender.male')}</option>
            <option value="female" ${currentUser?.gender === 'female' ? 'selected' : ''}>${t('auth.gender.female')}</option>
          </select>
          <label class="swal-label">${t('auth.fields.phone')}</label>
          <input id="swal-phone" class="swal-field" value="${escapeHtmlValue(currentUser?.phone)}" />
          <label class="swal-label">${t('auth.fields.email')}</label>
          <input id="swal-email" class="swal-field" type="email" value="${escapeHtmlValue(currentUser?.email)}" />
          <label class="swal-label">${t('dashboard.president.staff.fields.role')}</label>
          <select id="swal-role" class="swal-field">
            <option value="rh" ${currentUser?.role?.slug === 'rh' ? 'selected' : ''}>${t('roles.rh')}</option>
            <option value="naib_rh" ${currentUser?.role?.slug === 'naib_rh' ? 'selected' : ''}>${t('roles.naib_rh')}</option>
          </select>
          <label class="swal-label">${t('dashboard.president.staff.columns.status')}</label>
          <select id="swal-active" class="swal-field">
            <option value="1" ${currentUser?.is_active !== false ? 'selected' : ''}>${t('common.active')}</option>
            <option value="0" ${currentUser?.is_active === false ? 'selected' : ''}>${t('common.inactive')}</option>
          </select>
          <label class="swal-label">${isEdit ? t('dashboard.president.staff.fields.new_password_optional') : t('auth.fields.password')}</label>
          <input id="swal-password" class="swal-field" type="password" placeholder="${isEdit ? t('dashboard.president.staff.placeholders.password_optional') : ''}" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: isEdit ? t('dashboard.president.staff.actions.save') : t('dashboard.president.staff.actions.add'),
      cancelButtonText: t('common.cancel'),
      preConfirm: () => {
        const payload = {
          last_name: document.getElementById('swal-last-name')?.value?.trim(),
          first_name: document.getElementById('swal-first-name')?.value?.trim(),
          cin: document.getElementById('swal-cin')?.value?.trim(),
          birth_date: document.getElementById('swal-birth-date')?.value?.trim(),
          gender: document.getElementById('swal-gender')?.value?.trim(),
          phone: document.getElementById('swal-phone')?.value?.trim(),
          email: document.getElementById('swal-email')?.value?.trim(),
          role_slug: document.getElementById('swal-role')?.value?.trim(),
          locale: currentUser?.locale ?? 'fr',
          is_active: document.getElementById('swal-active')?.value === '1',
          password: document.getElementById('swal-password')?.value ?? '',
        }

        if (
          !payload.last_name ||
          !payload.first_name ||
          !payload.cin ||
          !payload.birth_date ||
          !payload.gender ||
          !payload.phone ||
          !payload.email ||
          !payload.role_slug
        ) {
          Swal.showValidationMessage(t('dashboard.president.staff.validation.required_fields'))
          return null
        }

        if (!isEdit && !payload.password) {
          Swal.showValidationMessage(t('dashboard.president.staff.validation.password_required'))
          return null
        }

        if (payload.password && payload.password.length < 8) {
          Swal.showValidationMessage(t('dashboard.president.staff.validation.password_min'))
          return null
        }

        if (!payload.password) {
          delete payload.password
        }

        return payload
      },
    })

    if (!result.isConfirmed) {
      return null
    }

    return result.value
  }

  const addStaff = async () => {
    const payload = await askStaffPayload('create')
    if (!payload) return

    try {
      await api.post('/president/staff', payload)
      notifySuccess(t('dashboard.president.staff.messages.added'))
      await loadStaff()
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.president.staff.errors.add_failed',
      )
      notifyError(message)
    }
  }

  const editStaff = async (user) => {
    const payload = await askStaffPayload('edit', user)
    if (!payload) return

    setBusyId(user.id)
    try {
      await api.put(`/president/staff/${user.id}`, payload)
      notifySuccess(t('dashboard.president.staff.messages.updated'))
      await loadStaff()
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.president.staff.errors.update_failed',
      )
      notifyError(message)
    } finally {
      setBusyId(null)
    }
  }

  const deleteStaff = async (user) => {
    const confirmation = await appSwal.fire({
      icon: 'warning',
      title: t('dashboard.president.staff.modals.delete_title'),
      text: t('dashboard.president.staff.modals.delete_text', { name: user.full_name }),
      showCancelButton: true,
      confirmButtonText: t('dashboard.president.staff.actions.delete'),
      cancelButtonText: t('common.cancel'),
    })

    if (!confirmation.isConfirmed) {
      return
    }

    setBusyId(user.id)
    try {
      await api.delete(`/president/staff/${user.id}`)
      notifySuccess(t('dashboard.president.staff.messages.deleted'))
      await loadStaff()
    } catch (apiError) {
      const message = translateServerMessage(
        t,
        i18n,
        apiError?.response?.data?.message,
        'dashboard.president.staff.errors.delete_failed',
      )
      notifyError(message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="dashboard-wrap">
      <h1>{t('dashboard.president.staff.title')}</h1>
      <div className="panel">
        <div className="panel-head">
          <h2>{t('dashboard.president.staff.table_title')}</h2>
          <button type="button" className="btn btn-gold btn-compact" onClick={addStaff}>
            {t('dashboard.president.staff.actions.add')}
          </button>
        </div>

        {loading ? <p>{t('common.loading')}...</p> : null}

        <table className="table">
          <thead>
            <tr>
              <th className="staff-photo-column">{t('dashboard.president.staff.columns.photo')}</th>
              <th>{t('dashboard.president.staff.columns.full_name')}</th>
              <th>{t('auth.fields.cin')}</th>
              <th>{t('auth.fields.birth_date')}</th>
              <th>{t('auth.fields.gender')}</th>
              <th>{t('auth.fields.email')}</th>
              <th>{t('auth.fields.phone')}</th>
              <th>{t('dashboard.president.staff.columns.role')}</th>
              <th>{t('dashboard.president.staff.columns.status')}</th>
              <th>{t('dashboard.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((user) => (
              <tr key={user.id}>
                <td className="staff-photo-cell">
                  <div className="staff-user-avatar">
                    {staffPhotoUrls[user.id] ? (
                      <img
                        src={staffPhotoUrls[user.id]}
                        alt={t('dashboard.president.staff.photo_alt', {
                          name: user.full_name || t('common.not_available'),
                        })}
                      />
                    ) : (
                      <span>{getUserInitials(user)}</span>
                    )}
                  </div>
                </td>
                <td>{user.full_name}</td>
                <td>{user.cin}</td>
                <td>{formatBirthDate(user.birth_date, i18n.resolvedLanguage || i18n.language, t('common.not_available'))}</td>
                <td>
                  {user.gender === 'male'
                    ? t('auth.gender.male')
                    : user.gender === 'female'
                      ? t('auth.gender.female')
                      : t('common.not_available')}
                </td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{translateRole(t, user.role?.slug)}</td>
                <td>
                  <span className={`status ${user.is_active ? 'status-approved' : 'status-rejected'}`}>
                    {user.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                </td>
                <td>
                  <div className="actions-cell">
                    <button
                      type="button"
                      className="btn btn-outline btn-mini"
                      disabled={busyId === user.id}
                      onClick={() => editStaff(user)}
                    >
                      {t('dashboard.president.staff.actions.edit')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-mini"
                      disabled={busyId === user.id}
                      onClick={() => deleteStaff(user)}
                    >
                      {t('dashboard.president.staff.actions.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default PresidentStaffManagementPage
