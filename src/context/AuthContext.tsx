import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api, getToken, setToken } from '../api/client'
import type { Artist } from '../data/types'

interface RegisterPayload {
  email: string
  password: string
  name: string
  studio: string
  city: string
  styles: string[]
  bio: string
  instagram: string
  depositDkk: number
}

interface AuthState {
  artist: Artist | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [artist, setArtist] = useState<Artist | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setArtist(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.get<Artist>('/me')
      setArtist(me)
    } catch {
      setToken(null)
      setArtist(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; artist: Artist }>('/auth/login', { email, password })
    setToken(result.token)
    setArtist(result.artist)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await api.post<{ token: string; artist: Artist }>('/auth/register', payload)
    setToken(result.token)
    setArtist(result.artist)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setArtist(null)
  }, [])

  return (
    <AuthContext.Provider value={{ artist, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth skal bruges inden i AuthProvider')
  return ctx
}
