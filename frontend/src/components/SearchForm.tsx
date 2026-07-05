import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { SearchParams } from '@/lib/api'
import { cn } from '@/lib/utils'

const LEAD_COUNT_OPTIONS = [10, 20, 30, 50]

const NICHE_SUGGESTIONS = [
  'dentist',
  'restaurant',
  'bakery',
  'lawyer',
  'hairdresser',
  'electrician',
  'plumber',
  'architect',
  'real estate',
  'pharmacy',
  'hotel',
  'gym',
  'car repair',
  'veterinarian',
]

interface SearchFormProps {
  busy: boolean
  onSearch: (params: SearchParams) => void
}

export function SearchForm({ busy, onSearch }: SearchFormProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [hasWebsite, setHasWebsite] = useState(false)
  const [hasPhone, setHasPhone] = useState(false)
  const [limit, setLimit] = useState(20)

  const isValid =
    query.trim().length >= 2 && country.trim().length >= 2 && city.trim().length >= 2

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || busy) return
    onSearch({
      query: query.trim(),
      country: country.trim(),
      city: city.trim(),
      limit,
      has_website: hasWebsite,
      has_phone: hasPhone,
    })
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="business-type">{t('form.businessType')}</Label>
              <Input
                id="business-type"
                list="niche-suggestions"
                placeholder={t('form.businessTypePlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                required
              />
              <datalist id="niche-suggestions">
                {NICHE_SUGGESTIONS.map((niche) => (
                  <option key={niche} value={niche} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('form.country')}</Label>
              <Input
                id="country"
                placeholder={t('form.countryPlaceholder')}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t('form.city')}</Label>
              <Input
                id="city"
                placeholder={t('form.cityPlaceholder')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-3">
                <Switch id="has-website" checked={hasWebsite} onCheckedChange={setHasWebsite} />
                <Label htmlFor="has-website" className="cursor-pointer">
                  {t('form.hasWebsite')}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="has-phone" checked={hasPhone} onCheckedChange={setHasPhone} />
                <Label htmlFor="has-phone" className="cursor-pointer">
                  {t('form.hasPhone')}
                </Label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-muted-foreground">{t('form.leadCount')}</Label>
              <div className="flex rounded-lg border p-0.5">
                {LEAD_COUNT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLimit(option)}
                    className={cn(
                      'rounded-md px-3 py-1 text-sm font-medium transition-colors cursor-pointer',
                      limit === option
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!isValid || busy}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" />
                {t('form.searching')}
              </>
            ) : (
              <>
                <Sparkles />
                {t('form.generate')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
