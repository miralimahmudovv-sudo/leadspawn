import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, [data-cursor]'

export function CustomCursor() {
  const reducedMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [interactive, setInteractive] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const trailX = useSpring(x, { stiffness: 120, damping: 16, mass: 0.7 })
  const trailY = useSpring(y, { stiffness: 120, damping: 16, mass: 0.7 })

  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return

    setEnabled(true)
    document.documentElement.classList.add('custom-cursor')

    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      setVisible(true)
      const target = event.target as Element | null
      setInteractive(Boolean(target?.closest?.(INTERACTIVE_SELECTOR)))
    }
    const handleLeave = () => setVisible(false)
    const handleEnter = () => setVisible(true)

    window.addEventListener('mousemove', handleMove)
    document.documentElement.addEventListener('mouseleave', handleLeave)
    document.documentElement.addEventListener('mouseenter', handleEnter)
    return () => {
      document.documentElement.classList.remove('custom-cursor')
      window.removeEventListener('mousemove', handleMove)
      document.documentElement.removeEventListener('mouseleave', handleLeave)
      document.documentElement.removeEventListener('mouseenter', handleEnter)
    }
  }, [reducedMotion, x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] -ml-[5px] -mt-[5px] size-2.5 rounded-full bg-primary"
        style={{ x, y }}
        animate={{ opacity: visible ? 1 : 0, scale: interactive ? 0.5 : 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] -ml-[19px] -mt-[19px] size-[38px] rounded-full border-2 border-primary/40 bg-primary/10"
        style={{ x: trailX, y: trailY }}
        animate={{ opacity: visible ? 1 : 0, scale: interactive ? 1.6 : 1 }}
        transition={{ duration: 0.2 }}
      />
    </>
  )
}
