import { useTranslation } from 'react-i18next'

function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const options = [
    { key: 'ar', code: 'AR' },
    { key: 'fr', code: 'FR' },
  ]

  return (
    <div className="lang-switcher" role="group" aria-label={t('language.label')}>
      {options.map((option) => {
        const isActive = i18n.language === option.key

        return (
          <button
            key={option.key}
            type="button"
            className={`lang-switcher-btn ${isActive ? 'active' : ''}`}
            aria-pressed={isActive}
            onClick={() => i18n.changeLanguage(option.key)}
          >
            {option.code}
          </button>
        )
      })}
    </div>
  )
}

export default LanguageSwitcher
