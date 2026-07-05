import { Check, Copy, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { mapsUrl, type Lead } from '@/lib/api'

type CopiedField = 'phone' | 'email' | 'address' | null

const COPIED_MESSAGE: Record<Exclude<CopiedField, null>, string> = {
  phone: 'lead.phoneCopied',
  email: 'lead.emailCopied',
  address: 'lead.addressCopied',
}

export function LeadActions({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState<CopiedField>(null)
  const resetTimer = useRef<number | null>(null)

  const copyToClipboard = async (field: Exclude<CopiedField, null>, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const succeeded = document.execCommand('copy')
      textarea.remove()
      if (!succeeded) return
    }
    setCopied(field)
    toast.success(t(COPIED_MESSAGE[field]))
    if (resetTimer.current != null) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('lead.openWebsite')}
        title={t('lead.openWebsite')}
        disabled={!lead.website}
        onClick={() => lead.website && window.open(lead.website, '_blank', 'noopener')}
      >
        <ExternalLink />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('lead.openMaps')}
        title={t('lead.openMaps')}
        onClick={() => window.open(mapsUrl(lead), '_blank', 'noopener')}
      >
        <MapPin />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('lead.copyPhone')}
        title={t('lead.copyPhone')}
        disabled={!lead.phone}
        onClick={() => lead.phone && void copyToClipboard('phone', lead.phone)}
      >
        {copied === 'phone' ? <Check className="text-emerald-500" /> : <Phone />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('lead.copyEmail')}
        title={t('lead.copyEmail')}
        disabled={!lead.email}
        onClick={() => lead.email && void copyToClipboard('email', lead.email)}
      >
        {copied === 'email' ? <Check className="text-emerald-500" /> : <Mail />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('lead.copyAddress')}
        title={t('lead.copyAddress')}
        disabled={!lead.address}
        onClick={() => lead.address && void copyToClipboard('address', lead.address)}
      >
        {copied === 'address' ? <Check className="text-emerald-500" /> : <Copy />}
      </Button>
    </div>
  )
}
