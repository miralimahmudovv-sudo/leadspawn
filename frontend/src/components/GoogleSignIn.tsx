import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { useTheme } from '@/components/ThemeProvider'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (parent: HTMLElement, options: object) => void
        }
      }
    }
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client'

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function GoogleSignIn() {
  const { googleClientId, loginWithCredential } = useAuth()
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!googleClientId || !containerRef.current) return
    let cancelled = false

    void loadGsiScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: { credential: string }) => {
            void loginWithCredential(response.credential).catch(() => {
              toast.error('Sign-in failed')
            })
          },
        })
        containerRef.current.replaceChildren()
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          shape: 'pill',
          size: 'medium',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          text: 'signin_with',
        })
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [googleClientId, loginWithCredential, theme])

  if (!googleClientId) return null

  return <div ref={containerRef} className="flex h-9 items-center" />
}
