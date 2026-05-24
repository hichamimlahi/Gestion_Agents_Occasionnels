import { toast } from 'react-toastify'

const baseConfig = {
  position: 'top-right',
}

let notificationsSuspended = false
const queuedNotifications = []
let flushTimerId = null

function emitToast(level, message, config = baseConfig) {
  if (level === 'success') {
    toast.success(message, config)
    return
  }

  if (level === 'error') {
    toast.error(message, config)
    return
  }

  toast.info(message, config)
}

function isTransitionActive() {
  if (notificationsSuspended) {
    return true
  }

  if (typeof document === 'undefined') {
    return false
  }

  return Boolean(document.querySelector('.transition-loader'))
}

function queueToast(level, message, config = baseConfig) {
  if (!message) {
    return
  }

  queuedNotifications.push({
    level,
    message,
    config,
  })

  scheduleFlush()
}

function flushQueuedToasts() {
  while (queuedNotifications.length > 0) {
    const nextToast = queuedNotifications.shift()
    emitToast(nextToast.level, nextToast.message, nextToast.config)
  }
}

function scheduleFlush(delay = 0) {
  if (flushTimerId !== null || queuedNotifications.length === 0 || typeof window === 'undefined') {
    return
  }

  flushTimerId = window.setTimeout(() => {
    flushTimerId = null

    if (queuedNotifications.length === 0) {
      return
    }

    if (isTransitionActive()) {
      scheduleFlush(120)
      return
    }

    flushQueuedToasts()
  }, delay)
}

export function setNotificationsSuspended(isSuspended) {
  notificationsSuspended = Boolean(isSuspended)

  if (!notificationsSuspended) {
    scheduleFlush()
  }
}

export function notifySuccess(message) {
  queueToast('success', message, baseConfig)
}

export function notifyError(message) {
  queueToast('error', message, baseConfig)
}

export function notifyInfo(message) {
  queueToast('info', message, baseConfig)
}
