import { motion } from 'framer-motion'
import { useEffect } from 'react'

import { LogoMark } from '@/components/Logo'

const SPLASH_DURATION_MS = 1700

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, SPLASH_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-4">
        <motion.span
          layoutId="brand-mark"
          className="flex"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <LogoMark className="size-24" />
        </motion.span>
        <motion.span
          layoutId="brand-name"
          className="text-5xl font-extrabold tracking-tight sm:text-6xl"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
        >
          LeadSpawn
        </motion.span>
      </div>
    </motion.div>
  )
}
