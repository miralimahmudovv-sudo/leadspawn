import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex"
          >
            <Zap className="size-4 text-primary" fill="currentColor" />
          </motion.span>
          <span className="font-semibold text-foreground">LeadSpawn</span>
          <span className="hidden sm:inline">— {t('footer.tagline')}</span>
        </div>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          {t('footer.attribution')}
        </a>
      </div>
    </motion.footer>
  )
}
