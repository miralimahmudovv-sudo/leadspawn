export interface Lead {
  name: string
  website: string | null
  phone: string | null
  address: string | null
  rating: number | null
  user_ratings_total: number | null
  business_status: string | null
  google_maps_url: string | null
  latitude: number | null
  longitude: number | null
}

export interface SearchParams {
  query: string
  city: string
  country: string
  limit: number
  has_website: boolean
  has_phone: boolean
}

export interface SearchResponse {
  query: string
  city: string
  country: string
  count: number
  cached: boolean
  results: Lead[]
}

export class ApiError extends Error {
  readonly messageKey: string

  constructor(message: string, messageKey: string) {
    super(message)
    this.name = 'ApiError'
    this.messageKey = messageKey
  }
}

export async function searchLeads(
  params: SearchParams,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  let response: Response
  try {
    response = await fetch('/api/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Network error', 'errors.network')
  }

  if (!response.ok) {
    const messageKey =
      response.status === 404
        ? 'errors.locationNotFound'
        : response.status === 422
          ? 'errors.invalidInput'
          : 'errors.providerUnavailable'
    throw new ApiError(`Search failed with status ${response.status}`, messageKey)
  }

  return (await response.json()) as SearchResponse
}

export function mapsUrl(lead: Lead): string {
  if (lead.google_maps_url) return lead.google_maps_url
  if (lead.latitude != null && lead.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lead.latitude},${lead.longitude}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}`
}
