import { AnimatePresence, motion } from 'framer-motion'
import { Check, Crown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/components/AuthProvider'
import { GoogleSignIn } from '@/components/GoogleSignIn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PlanCard {
  key: 'anonymous' | 'free' | 'premium'
  searches: number
  highlight: boolean
}

const PLANS: PlanCard[] = [
  { key: 'anonymous', searches: 3, highlight: false },
  { key: 'free', searches: 10, highlight: false },
  { key: 'premium', searches: 50, highlight: true },
]

export function PricingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="relative">
              <button
                type="button"
                onClick={onClose}
                aria-label={t('pricing.close')}
                className="absolute right-4 top-4 cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold tracking-tight">{t('pricing.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('pricing.subtitle')}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.key}
                      className={cn(
                        'relative flex flex-col rounded-xl border p-5',
                        plan.highlight && 'border-primary shadow-lg shadow-primary/10',
                      )}
                    >
                      {plan.highlight && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-primary/40 bg-primary text-primary-foreground">
                          <Crown className="size-3" />
                          {t('pricing.discount')}
                        </Badge>
                      )}
                      <p className="font-semibold">{t(`plans.${plan.key}`)}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        {plan.key === 'premium' ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through">$29</span>
                            <span className="text-3xl font-extrabold">$14.99</span>
                            <span className="text-sm text-muted-foreground">{t('pricing.month')}</span>
                          </>
                        ) : (
                          <span className="text-3xl font-extrabold">$0</span>
                        )}
                      </div>
                      <p className="mt-3 flex items-center gap-2 text-sm">
                        <Check className="size-4 text-emerald-500" />
                        {t('pricing.perDay', { count: plan.searches })}
                      </p>
                      <div className="mt-auto pt-5">
                        {plan.key === 'anonymous' && (
                          <p className="text-xs text-muted-foreground">{t('pricing.noSignup')}</p>
                        )}
                        {plan.key === 'free' &&
                          (user ? (
                            <p className="text-xs font-medium text-primary">{t('pricing.current')}</p>
                          ) : (
                            <GoogleSignIn />
                          ))}
                        {plan.key === 'premium' &&
                          (user?.plan === 'premium' ? (
                            <p className="text-xs font-medium text-primary">{t('pricing.current')}</p>
                          ) : (
                            <Button className="w-full" disabled>
                              {t('pricing.comingSoon')}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
