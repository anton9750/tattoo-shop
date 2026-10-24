import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { artist, loading } = useAuth()

  if (loading) {
    return <p className="mx-auto max-w-5xl px-5 py-20 text-center text-paper-dim/60">Henter …</p>
  }
  if (!artist) {
    return <Navigate to="/log-ind" replace />
  }
  return <>{children}</>
}
