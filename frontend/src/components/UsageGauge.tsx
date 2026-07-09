import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/components/AuthProvider'

const RADIUS = 15
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function gaugeColor(fraction: number): string {
  if (fraction > 0.5) return '#8b5cf6'
  if (fraction > 0.2) return '#f59e0b'
  return '#ef4444'
}

export function UsageGauge({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  const { usage } = useAuth()

  if (!usage) return null

  const unlimited = usage.plan === 'unlimited'
  const remaining = Math.max(usage.limit - usage.used, 0)
  const fraction = unlimited ? 1 : usage.limit > 0 ? remaining / usage.limit : 0
  const color = unlimited ? '#8b5cf6' : gaugeColor(fraction)
  const label = unlimited ? '∞' : String(remaining)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.92 }}
      className="relative flex size-10 cursor-pointer items-center justify-center"
      aria-label={
        unlimited
          ? t('usage.unlimited')
          : t('usage.tooltip', { remaining, limit: usage.limit, plan: t(`plans.${usage.plan}`) })
      }
      title={
        unlimited
          ? t('usage.unlimited')
          : t('usage.tooltip', { remaining, limit: usage.limit, plan: t(`plans.${usage.plan}`) })
      }
    >
      <svg viewBox="0 0 40 40" className="size-10 -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="3.5"
          className="stroke-muted"
        />
        <motion.circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={false}
          animate={{
            strokeDashoffset: CIRCUMFERENCE * (1 - fraction),
            stroke: color,
          }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 8, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="text-xs font-bold tabular-nums"
            style={{ color }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
      {!unlimited && remaining === 0 && (
        <motion.span
          className="absolute inset-0 rounded-full"
          animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0.45)', '0 0 0 8px rgba(239,68,68,0)'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  )
}
