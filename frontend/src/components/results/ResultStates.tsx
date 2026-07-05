import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Inbox, Radar, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const LOADING_PHASES = [
  'loading.locating',
  'loading.scanning',
  'loading.collecting',
  'loading.finalizing',
]

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center"
    >
      {children}
    </motion.div>
  )
}

export function IdleState() {
  const { t } = useTranslation()
  return (
    <StateShell>
      <Inbox className="size-10 text-muted-foreground/50" />
      <p className="font-medium">{t('results.idleTitle')}</p>
      <p className="text-sm text-muted-foreground">{t('results.idleSubtitle')}</p>
    </StateShell>
  )
}

export function EmptyState() {
  const { t } = useTranslation()
  return (
    <StateShell>
      <SearchX className="size-10 text-muted-foreground/50" />
      <p className="font-medium">{t('results.emptyTitle')}</p>
      <p className="text-sm text-muted-foreground">{t('results.emptySubtitle')}</p>
    </StateShell>
  )
}

export function ErrorState({ errorKey, onRetry }: { errorKey: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <StateShell>
      <AlertTriangle className="size-10 text-destructive/70" />
      <p className="font-medium">{t('results.errorTitle')}</p>
      <p className="max-w-md text-sm text-muted-foreground">{t(errorKey)}</p>
      <Button variant="outline" className="mt-2" onClick={onRetry}>
        {t('results.retry')}
      </Button>
    </StateShell>
  )
}

export function LoadingState({ city }: { city: string }) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(
      () => setPhase((current) => (current + 1) % LOADING_PHASES.length),
      1700,
    )
    return () => window.clearInterval(timer)
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="text-primary"
        >
          <Radar className="size-5" />
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {t(LOADING_PHASES[phase], { city })}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}

export function DiscoveringIndicator() {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 text-sm text-primary"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      {t('results.discovering')}
    </motion.div>
  )
}
