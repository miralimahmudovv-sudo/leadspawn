import { AnimatePresence, motion } from 'framer-motion'
import { Download, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { LeadCard } from '@/components/results/LeadCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchHistoryDetail, type HistoryDetail, type HistoryItem, type SearchParams } from '@/lib/api'
import { exporters } from '@/lib/export'

interface HistoryLeadsModalProps {
  item: HistoryItem | null
  onClose: () => void
  onRepeat: (params: SearchParams) => void
}

export function HistoryLeadsModal({ item, onClose, onRepeat }: HistoryLeadsModalProps) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<HistoryDetail | null>(null)

  useEffect(() => {
    if (!item) {
      setDetail(null)
      return
    }
    setDetail(null)
    let cancelled = false
    void fetchHistoryDetail(item.id)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch(() => {
        if (!cancelled) toast.error(t('errors.network'))
      })
    return () => {
      cancelled = true
    }
  }, [item, t])

  const handleExport = async () => {
    if (!detail) return
    await exporters[0].export(detail.leads, {
      query: detail.query,
      city: detail.city,
      country: detail.country,
    })
    toast.success(t('results.exported'))
  }

  const repeat = () => {
    if (!item) return
    onClose()
    onRepeat({
      query: item.query,
      city: item.city,
      country: item.country,
      limit: 20,
      has_website: false,
      has_phone: false,
      has_email: false,
    })
  }

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b p-5">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold capitalize tracking-tight">
                  {item.query}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {item.city}, {item.country} · {t('account.leads', { count: item.result_count })}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('pricing.close')}
                className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detail === null ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-40 w-full" />
                  ))}
                </div>
              ) : detail.leads.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {t('account.noStoredLeads')}
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {detail.leads.map((lead, index) => (
                    <LeadCard key={`${index}-${lead.name}`} lead={lead} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t p-4">
              <Button variant="outline" onClick={repeat}>
                <RefreshCw />
                {t('account.repeat')}
              </Button>
              <Button onClick={() => void handleExport()} disabled={!detail || detail.leads.length === 0}>
                <Download />
                {t('results.exportCsv')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
