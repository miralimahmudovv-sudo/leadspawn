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

const BLOBS = [
  {
    className: 'absolute -top-32 left-1/4 size-96 rounded-full bg-primary/15 blur-3xl',
    animate: { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] },
    duration: 12,
  },
  {
    className:
      'absolute right-[-8rem] top-1/3 size-[26rem] rounded-full bg-fuchsia-500/10 blur-3xl',
    animate: { scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] },
    duration: 15,
  },
  {
    className:
      'absolute bottom-[-10rem] left-[10%] size-[24rem] rounded-full bg-sky-500/10 blur-3xl',
    animate: { scale: [1, 1.2, 1], opacity: [0.35, 0.6, 0.35] },
    duration: 18,
  },
]

export function Background({ count = 34 }: { count?: number }) {
  const reducedMotion = useReducedMotion()

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, id) => ({
        id,
        left: Math.random() * 100,
        top: 3 + Math.random() * 94,
        size: 3 + Math.random() * 5,
        duration: 9 + Math.random() * 12,
        delay: Math.random() * 8,
        drift: -(20 + Math.random() * 50),
      })),
    [count],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BLOBS.map((blob, index) => (
        <motion.div
          key={index}
          className={blob.className}
          animate={reducedMotion ? undefined : blob.animate}
          transition={{ duration: blob.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
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
              : { y: [0, particle.drift, 0], opacity: [0.1, 0.4, 0.1] }
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
