import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

function PageTransitionLoader({ visible, onExitComplete }) {
  const { t } = useTranslation()

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {visible ? (
        <motion.div
          className="transition-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="motif-overlay" />
          <div className="loader-content">
            <div className="logo-orbit">
              <svg className="orbit-svg" viewBox="0 0 220 220" aria-hidden="true">
                <g className="orbit-track orbit-track-a">
                  <ellipse className="orbit-tail orbit-tail-a" cx="110" cy="110" rx="86" ry="36" pathLength="100" />
                  <ellipse className="orbit-head orbit-head-a" cx="110" cy="110" rx="86" ry="36" pathLength="100" />
                </g>
                <g className="orbit-track orbit-track-b">
                  <ellipse className="orbit-tail orbit-tail-b" cx="110" cy="110" rx="92" ry="32" pathLength="100" />
                  <ellipse className="orbit-head orbit-head-b" cx="110" cy="110" rx="92" ry="32" pathLength="100" />
                </g>
                <g className="orbit-track orbit-track-c">
                  <ellipse className="orbit-tail orbit-tail-c" cx="110" cy="110" rx="80" ry="40" pathLength="100" />
                  <ellipse className="orbit-head orbit-head-c" cx="110" cy="110" rx="80" ry="40" pathLength="100" />
                </g>
                <g className="orbit-track orbit-track-d">
                  <ellipse className="orbit-tail orbit-tail-d" cx="110" cy="110" rx="88" ry="34" pathLength="100" />
                  <ellipse className="orbit-head orbit-head-d" cx="110" cy="110" rx="88" ry="34" pathLength="100" />
                </g>
                <g className="orbit-track orbit-track-e">
                  <ellipse className="orbit-tail orbit-tail-e" cx="110" cy="110" rx="83" ry="37" pathLength="100" />
                  <ellipse className="orbit-head orbit-head-e" cx="110" cy="110" rx="83" ry="37" pathLength="100" />
                </g>
              </svg>
              <img src="/logo-commune-larache-clean.png" alt={t('a11y.commune_logo_clean')} className="loader-logo" />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default PageTransitionLoader
