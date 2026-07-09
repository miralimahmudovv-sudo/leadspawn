export interface Lead {
  name: string
  website: string | null
  phone: string | null
  email: string | null
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
  has_email: boolean
}

export interface UsageInfo {
  used: number
  limit: number
  plan: string
  resets_at?: string | null
}

export interface HistoryItem {
  id: number
  query: string
  city: string
  country: string
  result_count: number
  created_at: string
}

export interface UsageStatus extends UsageInfo {
  authenticated: boolean
}

export interface UserInfo {
  email: string
  name: string | null
  picture: string | null
  plan: string
}

export interface SearchResponse {
  query: string
  city: string
  country: string
  count: number
  cached: boolean
  usage: UsageInfo | null
  results: Lead[]
}

export class ApiError extends Error {
  readonly messageKey: string
  readonly status: number

  constructor(message: string, messageKey: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.messageKey = messageKey
    this.status = status
  }
}

const TOKEN_KEY = 'leadspawn-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...init?.headers,
      },
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
          : response.status === 429
            ? 'errors.limitReached'
            : response.status === 401
              ? 'errors.notSignedIn'
              : 'errors.providerUnavailable'
    throw new ApiError(`Request failed with status ${response.status}`, messageKey, response.status)
  }

  return (await response.json()) as T
}

export function searchLeads(params: SearchParams, signal?: AbortSignal): Promise<SearchResponse> {
  return request<SearchResponse>('/api/v1/search', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  })
}

export function fetchAppConfig(): Promise<{ google_client_id: string }> {
  return request('/api/v1/config')
}

export function googleLogin(credential: string): Promise<{ token: string; user: UserInfo }> {
  return request('/api/v1/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export function fetchMe(): Promise<{ user: UserInfo; usage: UsageStatus }> {
  return request('/api/v1/auth/me')
}

export function fetchUsage(): Promise<UsageStatus> {
  return request('/api/v1/usage')
}

export function fetchHistory(): Promise<{ items: HistoryItem[] }> {
  return request('/api/v1/history')
}

export function mapsUrl(lead: Lead): string {
  if (lead.google_maps_url) return lead.google_maps_url
  if (lead.latitude != null && lead.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lead.latitude},${lead.longitude}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}`
}
