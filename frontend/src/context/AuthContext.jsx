import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import i18n from '../i18n'
import { notifyError, notifyInfo, notifySuccess } from '../lib/notify'
import { translateServerMessage } from '../lib/i18nHelpers'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {
      localStorage.removeItem('gol_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('gol_token')
    if (!token) {
      setLoading(false)
      return
    }
    refreshMe()
  }, [refreshMe])

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload)
    localStorage.setItem('gol_token', data.token)
    await refreshMe()
    notifySuccess(i18n.t('auth.login_success'))
    return data
  }

  const logout = async () => {
    try {
      const { data } = await api.post('/auth/logout')
      const message = translateServerMessage(i18n.t.bind(i18n), i18n, data?.message, 'auth.logout_success')
      notifyInfo(message)
    } catch (apiError) {
      const message = translateServerMessage(
        i18n.t.bind(i18n),
        i18n,
        apiError?.response?.data?.message,
        'auth.logout_error',
      )
      notifyError(message)
    } finally {
      localStorage.removeItem('gol_token')
      setUser(null)
    }
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return data
  }

  const verifyCode = async (payload) => {
    const { data } = await api.post('/auth/verify-code', payload)
    return data
  }

  const resendCode = async (payload) => {
    const { data } = await api.post('/auth/resend-code', payload)
    return data
  }

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    verifyCode,
    resendCode,
    refreshMe,
    isAuthenticated: Boolean(user),
    role: user?.role?.slug ?? null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
