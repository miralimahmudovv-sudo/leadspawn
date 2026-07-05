import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

interface Particle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  drift: number
}

export function Particles({ count = 26 }: { count?: number }) {
  const reducedMotion = useReducedMotion()

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, id) => ({
        id,
        left: Math.random() * 100,
        top: 5 + Math.random() * 90,
        size: 3 + Math.random() * 5,
        duration: 9 + Math.random() * 10,
        delay: Math.random() * 6,
        drift: -(20 + Math.random() * 45),
      })),
    [count],
  )

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-32 left-1/4 size-96 rounded-full bg-primary/15 blur-3xl"
        animate={reducedMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-24 right-1/5 size-80 rounded-full bg-fuchsia-500/10 blur-3xl"
        animate={reducedMotion ? undefined : { scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-primary/40"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={
            reducedMotion
              ? undefined
              : { y: [0, particle.drift, 0], opacity: [0.12, 0.45, 0.12] }
          }
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
