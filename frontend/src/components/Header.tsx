import { motion } from 'framer-motion'

import { useAuth } from '@/components/AuthProvider'
import { GoogleSignIn } from '@/components/GoogleSignIn'
import { LanguageMenu } from '@/components/LanguageMenu'
import { LogoMark } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UsageGauge } from '@/components/UsageGauge'
import { UserMenu } from '@/components/UserMenu'

const BRAND_LANDING = { type: 'spring', stiffness: 90, damping: 16 } as const

interface HeaderProps {
  showBrand: boolean
  onOpenPricing: () => void
}

export function Header({ showBrand, onOpenPricing }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {showBrand ? (
          <a href="#" className="flex items-center gap-2">
            <motion.span layoutId="brand-mark" className="flex" transition={BRAND_LANDING}>
              <LogoMark className="size-8" />
            </motion.span>
            <motion.span
              layoutId="brand-name"
              className="text-lg font-extrabold tracking-tight"
              transition={BRAND_LANDING}
            >
              LeadSpawn
            </motion.span>
          </a>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <UsageGauge onClick={onOpenPricing} />
          {user ? <UserMenu onOpenPricing={onOpenPricing} /> : <GoogleSignIn />}
          <div className="flex items-center gap-1">
            <LanguageMenu />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
