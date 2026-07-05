import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-primary" fill="currentColor" />
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
    </footer>
  )
}
