import { motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'

import { LogoMark } from '@/components/Logo'

const SPLASH_DURATION_MS = 2400
const LETTERS = 'LeadSpawn'.split('')

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, SPLASH_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [onDone])

  const burst = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2
        const distance = 64 + (index % 3) * 22
        return {
          id: index,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: index % 3 === 0 ? 7 : 4,
        }
      }),
    [],
  )

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        className="absolute size-[30rem] rounded-full bg-primary/15 blur-3xl"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.35, 1.1], opacity: [0, 0.9, 0.5] }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />

      <div className="relative flex flex-col items-center">
        <div className="flex items-center gap-4">
          <motion.span
            layoutId="brand-mark"
            className="relative flex"
            initial={{ scale: 0, rotate: -50 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          >
            <LogoMark className="size-24 drop-shadow-[0_0_24px_rgba(139,92,246,0.45)]" />
            {burst.map((dot) => (
              <motion.span
                key={dot.id}
                className="absolute left-1/2 top-1/2 rounded-full bg-primary"
                style={{
                  width: dot.size,
                  height: dot.size,
                  marginLeft: -dot.size / 2,
                  marginTop: -dot.size / 2,
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
                animate={{
                  x: dot.x,
                  y: dot.y,
                  opacity: [0, 1, 0],
                  scale: [1, 1, 0.2],
                }}
                transition={{ duration: 0.85, delay: 0.34, ease: 'easeOut' }}
              />
            ))}
          </motion.span>

          <motion.span
            layoutId="brand-name"
            className="flex text-5xl font-extrabold tracking-tight sm:text-6xl"
          >
            {LETTERS.map((letter, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 26, rotateX: 85 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.62 + index * 0.055, duration: 0.35, ease: 'easeOut' }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.span>
        </div>

        <motion.div
          className="mt-10 h-1 w-48 overflow-hidden rounded-full bg-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 1.9, ease: [0.4, 0, 0.2, 1] }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
