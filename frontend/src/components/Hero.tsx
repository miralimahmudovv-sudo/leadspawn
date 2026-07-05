import { motion, type Variants } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Particles } from '@/components/Particles'
import { Badge } from '@/components/ui/badge'

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export function Hero({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pt-36">
      <Particles />
      <motion.div
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={item} className="mb-5 flex justify-center">
          <Badge className="border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="size-3" />
            {t('hero.badge')}
          </Badge>
        </motion.div>
        <motion.h1
          variants={item}
          className="text-balance bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl md:text-6xl"
        >
          {t('hero.title')}
        </motion.h1>
        <motion.p
          variants={item}
          className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
        >
          {t('hero.subtitle')}
        </motion.p>
        <motion.div variants={item} className="mt-10">
          {children}
        </motion.div>
      </motion.div>
    </section>
  )
}
