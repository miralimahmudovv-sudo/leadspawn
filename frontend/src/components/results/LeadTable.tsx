import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { LeadActions } from '@/components/results/LeadActions'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Lead } from '@/lib/api'

export function LeadTable({ leads }: { leads: Lead[] }) {
  const { t } = useTranslation()

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t('lead.name')}</TableHead>
            <TableHead>{t('lead.website')}</TableHead>
            <TableHead>{t('lead.phone')}</TableHead>
            <TableHead>{t('lead.email')}</TableHead>
            <TableHead>{t('lead.address')}</TableHead>
            <TableHead>{t('lead.rating')}</TableHead>
            <TableHead>{t('lead.coordinates')}</TableHead>
            <TableHead className="text-right">{t('lead.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead, index) => (
            <motion.tr
              key={`${index}-${lead.name}`}
              className="border-b transition-colors hover:bg-muted/50 last:border-0"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <TableCell className="max-w-[220px] truncate font-medium">{lead.name}</TableCell>
              <TableCell className="max-w-[180px]">
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-primary hover:underline"
                  >
                    {lead.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{t('lead.noValue')}</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                {lead.phone ?? <span className="text-muted-foreground">{t('lead.noValue')}</span>}
              </TableCell>
              <TableCell className="max-w-[200px]">
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="block truncate text-primary hover:underline"
                  >
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{t('lead.noValue')}</span>
                )}
              </TableCell>
              <TableCell className="max-w-[260px] truncate text-muted-foreground">
                {lead.address ?? t('lead.noValue')}
              </TableCell>
              <TableCell>
                {lead.rating != null ? (
                  lead.rating.toFixed(1)
                ) : (
                  <span className="text-muted-foreground">{t('lead.noValue')}</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground/70">
                {lead.latitude != null && lead.longitude != null
                  ? `${lead.latitude.toFixed(4)}, ${lead.longitude.toFixed(4)}`
                  : t('lead.noValue')}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <LeadActions lead={lead} />
                </div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
