import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { Clock, Folder, FolderOpen, SearchX, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchHistory, type HistoryItem, type SearchParams } from '@/lib/api'
import { formatHistoryTime, formatResetTime } from '@/lib/format'

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

interface AccountPanelProps {
  open: boolean
  onClose: () => void
  onRunSearch: (params: SearchParams) => void
}

export function AccountPanel({ open, onClose, onRunSearch }: AccountPanelProps) {
  const { t, i18n } = useTranslation()
  const { user, usage } = useAuth()
  const [items, setItems] = useState<HistoryItem[] | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setItems(null)
    void fetchHistory()
      .then((response) => setItems(response.items))
      .catch(() => setItems([]))
  }, [open, user])

  const rerun = (item: HistoryItem) => {
    onClose()
    onRunSearch({
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
      {open && user && (
        <motion.div
          className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l bg-card shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold tracking-tight">{t('account.title')}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('pricing.close')}
                className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 border-b p-5">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="size-12 rounded-full border object-cover"
                />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-lg font-bold">
                  {(user.name ?? user.email)[0]?.toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{user.name ?? user.email}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Badge className="border-primary/40 bg-primary/10 text-primary">
                {t(`plans.${user.plan}`)}
              </Badge>
            </div>

            {usage && (
              <div className="border-b px-5 py-3 text-sm text-muted-foreground">
                <p>
                  {t('usage.tooltip', {
                    remaining: Math.max(usage.limit - usage.used, 0),
                    limit: usage.limit,
                    plan: t(`plans.${usage.plan}`),
                  })}
                </p>
                {usage.resets_at && usage.used > 0 && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs">
                    <Clock className="size-3" />
                    {t('usage.resetsAt', {
                      time: formatResetTime(usage.resets_at, i18n.language),
                    })}
                  </p>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('account.history')}
              </h3>

              {items === null && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              )}

              {items !== null && items.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                  <SearchX className="size-8 opacity-50" />
                  <p className="text-sm">{t('account.empty')}</p>
                </div>
              )}

              {items !== null && items.length > 0 && (
                <motion.ul
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2.5"
                >
                  {items.map((item) => (
                    <motion.li key={item.id} variants={itemVariants}>
                      <motion.button
                        type="button"
                        onClick={() => rerun(item)}
                        whileHover={{ x: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-background/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Folder className="size-5 group-hover:hidden" />
                          <FolderOpen className="hidden size-5 group-hover:block" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium capitalize">
                            {item.query}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.city}, {item.country}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <Badge className="border-border bg-secondary text-secondary-foreground">
                            {t('account.leads', { count: item.result_count })}
                          </Badge>
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {formatHistoryTime(item.created_at, i18n.language)}
                          </span>
                        </span>
                      </motion.button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
