import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const SESSION_KEY = 'leadspawn-presence-id'
const HEARTBEAT_MS = 20000

function sessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const fresh = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, fresh)
  return fresh
}

export function OnlineCounter() {
  const { t } = useTranslation()
  const [online, setOnline] = useState<number | null>(null)

  useEffect(() => {
    const id = sessionId()
    let cancelled = false

    const beat = async () => {
      try {
        const response = await fetch('/api/v1/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: id }),
        })
        if (!response.ok) return
        const data = (await response.json()) as { online: number }
        if (!cancelled) setOnline(data.online)
      } catch {
        return
      }
    }

    void beat()
    const timer = window.setInterval(() => {
      if (!document.hidden) void beat()
    }, HEARTBEAT_MS)
    const onVisible = () => {
      if (!document.hidden) void beat()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (online === null) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      title={t('online.tooltip', { count: online })}
      aria-label={t('online.tooltip', { count: online })}
      className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.55)]" />
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={online}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        >
          {online}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}
