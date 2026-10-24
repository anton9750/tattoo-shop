import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { inputClass } from '../styles/form'

export default function ArtistLogin() {
  const { artist, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (artist) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kunne ikke logge ind. Prøv igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-3xl font-bold">Log ind</h1>
      <p className="mt-2 text-paper-dim/80">Log ind for at styre din profil og dine bookinger.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <input
          required
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          required
          type="password"
          placeholder="Adgangskode"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />

        {error && <p className="text-sm text-flash">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-sm bg-flash px-5 py-3 font-medium text-paper transition-colors hover:bg-flash-dim disabled:opacity-60"
        >
          {submitting ? 'Logger ind …' : 'Log ind'}
        </button>

        <p className="text-center text-sm text-paper-dim/70">
          <Link to="/glemt-adgangskode" className="text-brass hover:underline">
            Glemt adgangskode?
          </Link>
        </p>

        <p className="text-center text-sm text-paper-dim/70">
          Ny hos InkMap?{' '}
          <Link to="/for-tatovorer/opret" className="text-brass hover:underline">
            Opret en profil
          </Link>
        </p>
      </form>
    </div>
  )
}
