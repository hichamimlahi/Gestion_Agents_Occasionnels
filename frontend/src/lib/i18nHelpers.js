const statusTranslationKeys = {
  draft: 'status_labels.pending',
  submitted: 'status_labels.pending',
  pending: 'status_labels.pending',
  rh_review: 'status_labels.pending',
  president_review: 'status_labels.sent_to_president',
  approved: 'status_labels.accepted',
  rejected: 'status_labels.rejected',
  president_approved: 'status_labels.validated_by_president',
  president_rejected: 'status_labels.rejected_by_president',
  finalized: 'status_labels.validated_by_president',
  on_hold: 'status_labels.incomplete_file',
  valid: 'status_labels.document_valid',
  document_valid: 'status_labels.document_valid',
  invalid: 'status_labels.document_rejected',
  document_rejected: 'status_labels.document_rejected',
}

const roleTranslationKeys = {
  occasionnel: 'roles.occasionnel',
  rh: 'roles.rh',
  naib_rh: 'roles.naib_rh',
  president: 'roles.president',
  admin: 'roles.administrator',
  administrator: 'roles.administrator',
}

const documentTypeTranslationKeys = {
  cin: 'documents.types.cin',
  cv: 'documents.types.cv',
  lettre_demande: 'documents.types.lettre_demande',
  photo: 'documents.types.photo',
  permis: 'documents.types.permis',
  diplome: 'documents.types.diplome',
  engagement: 'documents.types.engagement',
  prise_service: 'documents.types.prise_service',
  decision: 'documents.types.decision',
  affectation: 'documents.types.affectation',
  dossier_summary: 'documents.types.dossier_summary',
}

const summaryTranslationKeys = {
  total_candidates: 'dashboard.stats.total_candidates',
  submitted_applications: 'dashboard.stats.submitted_applications',
  approved_applications: 'dashboard.stats.approved_applications',
  pending_president: 'dashboard.stats.pending_president',
  total_applications: 'dashboard.stats.total_applications',
  pending: 'dashboard.stats.pending',
  approved: 'dashboard.stats.approved',
  rejected: 'dashboard.stats.rejected',
  submitted: 'dashboard.stats.submitted',
  rh_review: 'dashboard.stats.rh_review',
  president_review: 'dashboard.stats.president_review',
  salary_total_net: 'dashboard.stats.salary_total_net',
  pending_approvals: 'dashboard.stats.pending_approvals',
  total_processed: 'dashboard.stats.total_processed',
}

const complianceAlertTranslationKeys = {
  'overlap detected with previous work period.': 'dashboard.alerts.overlap_detected',
  'mandatory stop period (10 to 15 days) not respected after 3 months.':
    'dashboard.alerts.mandatory_break_not_respected',
  'mandatory stop period respected.': 'dashboard.alerts.mandatory_break_respected',
}

const serverMessageTranslationKeys = {
  'missing required documents.': 'server_messages.missing_required_documents',
  'application submitted successfully.': 'server_messages.application_submitted_successfully',
  'verification code not found.': 'server_messages.verification_code_not_found',
  'verification code expired.': 'server_messages.verification_code_expired',
  'maximum verification attempts reached.': 'server_messages.maximum_verification_attempts_reached',
  'invalid verification code.': 'server_messages.invalid_verification_code',
  'account verified successfully.': 'server_messages.account_verified_successfully',
  'unauthorized role.': 'server_messages.unauthorized_role',
  'access denied for this role.': 'server_messages.access_denied_for_role',
  "l'age doit etre strictement superieur a 18 ans et strictement inferieur a 60 ans.":
    'server_messages.invalid_age_range',
  'compte cree. verifiez votre email avec le code envoye.': 'server_messages.account_created_verify_email',
  'nouveau code envoye.': 'server_messages.new_code_sent',
  'identifiants invalides.': 'server_messages.invalid_credentials',
  'compte non active. verifiez votre code de confirmation.': 'server_messages.account_not_active',
  'deconnexion effectuee.': 'server_messages.logout_success',
  'candidate profile missing.': 'server_messages.candidate_profile_missing',
  'demande creee en brouillon.': 'server_messages.application_created_draft',
  'acces refuse.': 'server_messages.access_denied',
  'acces refuse': 'server_messages.access_denied',
  'fichier introuvable.': 'server_messages.file_not_found',
  'document uploade avec succes.': 'server_messages.document_uploaded_success',
  'document supprime.': 'server_messages.document_deleted',
  'document genere.': 'server_messages.document_generated',
  "cette demande n'est pas en attente de decision president.":
    'server_messages.application_not_waiting_president_decision',
  'decision enregistree.': 'server_messages.decision_saved',
  'document mismatch.': 'server_messages.document_mismatch',
  'validation du document enregistree.': 'server_messages.document_validation_saved',
  "rh ne peut pas valider un candidat hors limite d'age (strictement entre 18 et 60 ans).":
    'server_messages.rh_cannot_validate_age',
  'demande transferee au president.': 'server_messages.application_sent_to_president',
  'la decision finale doit correspondre a la decision du president.': 'server_messages.final_decision_must_match_president',
  'processus rh finalise.': 'server_messages.rh_process_finalized',
  'notification marquee comme lue.': 'server_messages.notification_marked_read',
  'utilisateur rh cree avec succes.': 'server_messages.staff_created',
  'utilisateur rh mis a jour avec succes.': 'server_messages.staff_updated',
  'utilisateur rh supprime avec succes.': 'server_messages.staff_deleted',
  'utilisateur non autorise dans cette gestion.': 'server_messages.staff_not_allowed',
  'profile updated successfully.': 'server_messages.profile_updated_successfully',
  'current password is incorrect.': 'server_messages.current_password_incorrect',
  'profile photo not found.': 'server_messages.profile_photo_not_found',
}

const notificationExactTranslationKeys = {
  'code de verification': 'notifications.code_verification_title',
  'nouveau code de verification': 'notifications.new_code_verification_title',
  'decision du president': 'notifications.president_decision_title',
  'demande acceptee': 'notifications.application_accepted_title',
  'demande rejetee': 'notifications.application_rejected_title',
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function toReadableText(value) {
  if (!value) {
    return ''
  }

  return String(value).replaceAll('_', ' ')
}

function getLanguage(i18n) {
  const language = i18n?.resolvedLanguage || i18n?.language || 'fr'
  return language.startsWith('ar') ? 'ar' : 'fr'
}

export function translateStatus(t, status) {
  const key = statusTranslationKeys[status]
  if (key) {
    return t(key)
  }

  return toReadableText(status)
}

export function translateRole(t, role) {
  const key = roleTranslationKeys[role]
  if (key) {
    return t(key)
  }

  return toReadableText(role)
}

export function translateDocumentType(t, documentType) {
  const key = documentTypeTranslationKeys[documentType]
  if (key) {
    return t(key)
  }

  return toReadableText(documentType)
}

export function translateSummaryKey(t, key) {
  const translationKey = summaryTranslationKeys[key]
  if (translationKey) {
    return t(translationKey)
  }

  return toReadableText(key)
}

export function translateComplianceAlert(t, alert) {
  const translationKey = complianceAlertTranslationKeys[normalizeText(alert)]
  if (translationKey) {
    return t(translationKey)
  }

  return alert
}

export function translateServerMessage(t, i18n, message, fallbackKey = 'common.generic_error') {
  if (!message) {
    return t(fallbackKey)
  }

  const translationKey = serverMessageTranslationKeys[normalizeText(message)]
  if (translationKey) {
    return t(translationKey)
  }

  if (getLanguage(i18n) === 'ar') {
    return t(fallbackKey)
  }

  return message
}

export function translateNotificationText(t, i18n, text, type = 'body') {
  const rawText = String(text ?? '').trim()
  const normalizedText = normalizeText(rawText)

  if (type === 'title') {
    const translationKey = notificationExactTranslationKeys[normalizedText]
    if (translationKey) {
      return t(translationKey)
    }
  }

  if (normalizedText.startsWith('votre code de verification est:')) {
    const code = rawText.split(':').slice(1).join(':').trim()
    return t('notifications.code_verification_body', { code: code || '------' })
  }

  if (normalizedText.startsWith('votre nouveau code est:')) {
    const code = rawText.split(':').slice(1).join(':').trim()
    return t('notifications.new_code_verification_body', { code: code || '------' })
  }

  if (normalizedText === 'votre dossier a ete acceptee par le president et transmis au rh pour finalisation.') {
    return t('notifications.president_decision_accepted_body')
  }

  if (normalizedText === 'votre dossier a ete rejetee par le president et transmis au rh pour finalisation.') {
    return t('notifications.president_decision_rejected_body')
  }

  if (normalizedText === "votre demande a ete acceptee et finalisee par l'administration rh.") {
    return t('notifications.application_accepted_body')
  }

  if (normalizedText === 'votre demande a ete rejetee apres decision finale.') {
    return t('notifications.application_rejected_body')
  }

  return translateServerMessage(t, i18n, rawText, 'common.generic_info')
}
