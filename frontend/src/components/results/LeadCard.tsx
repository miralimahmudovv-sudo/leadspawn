import { motion } from 'framer-motion'
import { Globe, Mail, MapPin, Phone, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LeadActions } from '@/components/results/LeadActions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Lead } from '@/lib/api'

function formatCoordinates(lead: Lead): string | null {
  if (lead.latitude == null || lead.longitude == null) return null
  return `${lead.latitude.toFixed(4)}, ${lead.longitude.toFixed(4)}`
}

export function LeadCard({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const coordinates = formatCoordinates(lead)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug">{lead.name}</h3>
            {lead.rating != null && (
              <Badge className="shrink-0 border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <Star className="size-3 fill-current" />
                {lead.rating.toFixed(1)}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-2">{lead.address ?? t('lead.noValue')}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0" />
              <span className="font-mono text-xs">{lead.phone ?? t('lead.noValue')}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0" />
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="truncate text-primary hover:underline"
                >
                  {lead.email}
                </a>
              ) : (
                <span>{t('lead.noValue')}</span>
              )}
            </p>
            <p className="flex items-center gap-2">
              <Globe className="size-3.5 shrink-0" />
              {lead.website ? (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {lead.website.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                <span>{t('lead.noValue')}</span>
              )}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between border-t pt-3">
            <span className="font-mono text-[11px] text-muted-foreground/70">
              {coordinates ?? t('lead.noValue')}
            </span>
            <LeadActions lead={lead} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
