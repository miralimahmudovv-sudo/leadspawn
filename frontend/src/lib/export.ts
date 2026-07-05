import type { Lead } from '@/lib/api'

export interface ExportMeta {
  query: string
  city: string
  country: string
}

export interface Exporter {
  id: string
  labelKey: string
  export: (leads: Lead[], meta: ExportMeta) => void | Promise<void>
}

const DELIMITER = ';'

const CSV_COLUMNS: ReadonlyArray<[header: string, value: (lead: Lead, meta: ExportMeta) => string]> =
  [
    ['Name', (l) => l.name],
    ['Website', (l) => l.website ?? ''],
    ['Phone', (l) => l.phone ?? ''],
    ['Email', (l) => l.email ?? ''],
    ['Address', (l) => l.address ?? ''],
    ['City', (_, m) => m.city],
    ['Country', (_, m) => m.country],
    ['Rating', (l) => (l.rating != null ? String(l.rating) : '')],
    ['Latitude', (l) => (l.latitude != null ? String(l.latitude) : '')],
    ['Longitude', (l) => (l.longitude != null ? String(l.longitude) : '')],
  ]

function csvEscape(value: string): string {
  if (/["\n\r;]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function slugify(value: string): string {
  return value.toLowerCase().replaceAll(/[^\p{L}\p{N}]+/gu, '-').replaceAll(/^-|-$/g, '')
}

const csvExporter: Exporter = {
  id: 'csv',
  labelKey: 'results.exportCsv',
  export: (leads, meta) => {
    const header = CSV_COLUMNS.map(([name]) => name).join(DELIMITER)
    const rows = leads.map((lead) =>
      CSV_COLUMNS.map(([, value]) => csvEscape(value(lead, meta))).join(DELIMITER),
    )
    const content = `sep=${DELIMITER}\r\n` + [header, ...rows].join('\r\n')
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leadspawn-${slugify(meta.query)}-${slugify(meta.city)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  },
}

export const exporters: Exporter[] = [csvExporter]
