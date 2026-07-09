import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LogoMark } from '@/components/Logo'

const GITHUB_URL = 'https://github.com/miralimahmudovv-sudo/leadspawn'
const CONTACT_EMAIL = 'miralimahmudovv@gmail.com'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.56 22.29 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z" />
    </svg>
  )
}

export function Footer() {
  const { t } = useTranslation()

  return (
    <motion.footer
      className="border-t py-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-muted-foreground sm:px-6">
        <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex"
            >
              <LogoMark className="size-5" />
            </motion.span>
            <span className="font-semibold text-foreground">LeadSpawn</span>
            <span className="hidden sm:inline">— {t('footer.tagline')}</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <GithubIcon className="size-4" />
              GitHub
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:text-foreground hover:underline"
        >
          {t('footer.attribution')}
        </a>
      </div>
    </motion.footer>
  )
}
