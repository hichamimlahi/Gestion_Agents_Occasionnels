import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import fr from './locales/fr.json'

const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
}

const LANGUAGE_STORAGE_KEY = 'app_language'

const getInitialLanguage = () => {
  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (savedLanguage === 'ar' || savedLanguage === 'fr') {
    return savedLanguage
  }

  return 'fr'
}

const applyDocumentLanguage = (language) => {
  const dir = language === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = language
  document.documentElement.dir = dir
  document.body.dir = dir
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'ar'],
    lng: getInitialLanguage(),
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (lng) => {
  applyDocumentLanguage(lng)
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
})

applyDocumentLanguage(i18n.language)

export default i18n
