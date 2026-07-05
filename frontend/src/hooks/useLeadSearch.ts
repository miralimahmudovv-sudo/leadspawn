import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ApiError, searchLeads, type Lead, type SearchParams } from '@/lib/api'
import type { ExportMeta } from '@/lib/export'

export type SearchStatus = 'idle' | 'searching' | 'revealing' | 'done' | 'error'

export interface LeadSearchState {
  status: SearchStatus
  leads: Lead[]
  total: number
  cached: boolean
  errorKey: string | null
  meta: ExportMeta | null
}

const INITIAL_STATE: LeadSearchState = {
  status: 'idle',
  leads: [],
  total: 0,
  cached: false,
  errorKey: null,
  meta: null,
}

// Results arrive in one response; revealing them one by one makes the
// search feel like a live discovery process.
const MIN_REVEAL_DELAY_MS = 90
const MAX_REVEAL_DELAY_MS = 170
const TARGET_REVEAL_TOTAL_MS = 3500

export function useLeadSearch() {
  const { t } = useTranslation()
  const [state, setState] = useState<LeadSearchState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)
  const revealTimerRef = useRef<number | null>(null)
  const lastParamsRef = useRef<SearchParams | null>(null)

  const stopReveal = useCallback(() => {
    if (revealTimerRef.current != null) {
      window.clearInterval(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }, [])

  useEffect(
    () => () => {
      stopReveal()
      abortRef.current?.abort()
    },
    [stopReveal],
  )

  const search = useCallback(
    async (params: SearchParams) => {
      abortRef.current?.abort()
      stopReveal()
      const controller = new AbortController()
      abortRef.current = controller
      lastParamsRef.current = params
      const meta: ExportMeta = {
        query: params.query,
        city: params.city,
        country: params.country,
      }
      setState({ status: 'searching', leads: [], total: 0, cached: false, errorKey: null, meta })

      let results: Lead[]
      let cached: boolean
      try {
        const response = await searchLeads(params, controller.signal)
        results = response.results
        cached = response.cached
      } catch (error) {
        if (controller.signal.aborted) return
        const errorKey = error instanceof ApiError ? error.messageKey : 'errors.network'
        setState({ status: 'error', leads: [], total: 0, cached: false, errorKey, meta })
        return
      }
      if (controller.signal.aborted) return

      if (results.length === 0) {
        setState({ status: 'done', leads: [], total: 0, cached, errorKey: null, meta })
        return
      }

      setState({ status: 'revealing', leads: [], total: results.length, cached, errorKey: null, meta })
      const delay = Math.max(
        MIN_REVEAL_DELAY_MS,
        Math.min(MAX_REVEAL_DELAY_MS, TARGET_REVEAL_TOTAL_MS / results.length),
      )
      let revealed = 0
      revealTimerRef.current = window.setInterval(() => {
        revealed += 1
        const finished = revealed >= results.length
        setState((prev) => ({
          ...prev,
          status: finished ? 'done' : 'revealing',
          leads: results.slice(0, revealed),
        }))
        if (finished) {
          stopReveal()
          toast.success(t('results.searchDone', { count: results.length, city: meta.city }))
        }
      }, delay)
    },
    [stopReveal, t],
  )

  const retry = useCallback(() => {
    const params = lastParamsRef.current
    if (params) void search(params)
  }, [search])

  return { state, search, retry }
}
