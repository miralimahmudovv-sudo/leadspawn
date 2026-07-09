import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import {
  fetchAppConfig,
  fetchMe,
  fetchUsage,
  googleLogin,
  getToken,
  setToken,
  type UsageInfo,
  type UsageStatus,
  type UserInfo,
} from '@/lib/api'

interface AuthContextValue {
  user: UserInfo | null
  usage: UsageStatus | null
  googleClientId: string
  loginWithCredential: (credential: string) => Promise<void>
  logout: () => void
  applyUsage: (usage: UsageInfo) => void
  refreshUsage: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [googleClientId, setGoogleClientId] = useState('')

  const refreshUsage = useCallback(async () => {
    try {
      setUsage(await fetchUsage())
    } catch {
      setUsage(null)
    }
  }, [])

  useEffect(() => {
    void fetchAppConfig()
      .then((config) => setGoogleClientId(config.google_client_id))
      .catch(() => setGoogleClientId(''))

    const bootstrap = async () => {
      if (getToken()) {
        try {
          const me = await fetchMe()
          setUser(me.user)
          setUsage(me.usage)
          return
        } catch {
          setToken(null)
        }
      }
      await refreshUsage()
    }
    void bootstrap()
  }, [refreshUsage])

  const loginWithCredential = useCallback(
    async (credential: string) => {
      const response = await googleLogin(credential)
      setToken(response.token)
      setUser(response.user)
      await refreshUsage()
    },
    [refreshUsage],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    void refreshUsage()
  }, [refreshUsage])

  const applyUsage = useCallback((info: UsageInfo) => {
    setUsage((current) => ({
      ...info,
      authenticated: current?.authenticated ?? false,
    }))
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, usage, googleClientId, loginWithCredential, logout, applyUsage, refreshUsage }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
