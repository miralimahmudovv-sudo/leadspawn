import { AnimatePresence, motion } from 'framer-motion'
import { Download, LayoutGrid, TableProperties, Zap } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { LeadCard } from '@/components/results/LeadCard'
import { LeadTable } from '@/components/results/LeadTable'
import {
  DiscoveringIndicator,
  EmptyState,
  ErrorState,
  IdleState,
  LoadingState,
} from '@/components/results/ResultStates'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { LeadSearchState } from '@/hooks/useLeadSearch'
import { exporters } from '@/lib/export'
import { cn } from '@/lib/utils'

type ViewMode = 'cards' | 'table'

interface ResultsSectionProps {
  state: LeadSearchState
  onRetry: () => void
}

export function ResultsSection({ state, onRetry }: ResultsSectionProps) {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const { status, leads, cached, meta, errorKey } = state
  const canExport = status === 'done' && leads.length > 0 && meta != null

  const handleExport = async (exporterId: string) => {
    const exporter = exporters.find((entry) => entry.id === exporterId)
    if (!exporter || !meta) return
    await exporter.export(leads, meta)
    toast.success(t('results.exported'))
  }

  return (
    <section id="results" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight">{t('results.title')}</h2>
          {(status === 'revealing' || status === 'done') && leads.length > 0 && (
            <motion.span
              key={leads.length}
              initial={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {t('results.found', { count: leads.length })}
            </motion.span>
          )}
          {status === 'done' && cached && leads.length > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"
            >
              <Zap className="size-3 fill-current" />
              {t('results.cached')}
            </motion.span>
          )}
          <AnimatePresence>{status === 'revealing' && <DiscoveringIndicator />}</AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {(
              [
                ['cards', LayoutGrid, t('results.cards')],
                ['table', TableProperties, t('results.table')],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-label={label}
                title={label}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  viewMode === mode
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!canExport}>
                <Download />
                {t('results.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {exporters.map((exporter) => (
                <DropdownMenuItem
                  key={exporter.id}
                  onSelect={() => void handleExport(exporter.id)}
                >
                  {t(exporter.labelKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && <IdleState key="idle" />}
        {status === 'searching' && <LoadingState key="loading" city={meta?.city ?? ''} />}
        {status === 'error' && errorKey && (
          <ErrorState key="error" errorKey={errorKey} onRetry={onRetry} />
        )}
        {status === 'done' && leads.length === 0 && <EmptyState key="empty" />}
        {(status === 'revealing' || status === 'done') && leads.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {viewMode === 'cards' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {leads.map((lead, index) => (
                  <LeadCard key={`${index}-${lead.name}`} lead={lead} />
                ))}
              </div>
            ) : (
              <LeadTable leads={leads} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
