import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'

const entrance = (delay: number) =>
  ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: 'easeOut', delay },
  }) as const

interface HeroProps {
  compact: boolean
  children: React.ReactNode
}

export function Hero({ compact, children }: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className="relative pb-16 pt-24 sm:pt-28">
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.div
          initial={false}
          animate={
            compact
              ? { height: 0, opacity: 0, y: -32 }
              : { height: 'auto', opacity: 1, y: 0 }
          }
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-hidden"
        >
          <div className="pt-8">
            <motion.div {...entrance(0.1)} className="mb-5 flex justify-center">
              <Badge className="border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="size-3" />
                {t('hero.badge')}
              </Badge>
            </motion.div>
            <motion.h1
              {...entrance(0.22)}
              className="animate-gradient-text text-balance bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl md:text-6xl"
            >
              {t('hero.title')}
            </motion.h1>
            <motion.p
              {...entrance(0.34)}
              className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
            >
              {t('hero.subtitle')}
            </motion.p>
          </div>
        </motion.div>
        <motion.div {...entrance(0.46)} className="mt-10">
          {children}
        </motion.div>
      </div>
    </section>
  )
}
