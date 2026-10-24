import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { inputClass } from '../styles/form'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Noget gik galt. Prøv igen.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20">
        <h1 className="font-display text-3xl font-bold">Ugyldigt link</h1>
        <p className="mt-2 text-paper-dim/80">
          Linket mangler eller er forkert. Bed om et nyt på{' '}
          <Link to="/glemt-adgangskode" className="text-brass hover:underline">
            glemt adgangskode
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-3xl font-bold">Vælg ny adgangskode</h1>

      {done ? (
        <div className="mt-8 rounded-sm border border-brass/40 p-6">
          <p className="font-display text-xl font-bold text-brass">Adgangskode skiftet</p>
          <p className="mt-2 text-paper-dim/90">Du kan nu logge ind med din nye adgangskode.</p>
          <button
            onClick={() => navigate('/log-ind')}
            className="mt-6 rounded-sm border border-charcoal px-5 py-2 text-sm hover:border-brass"
          >
            Log ind
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            required
            type="password"
            minLength={8}
            placeholder="Ny adgangskode (mindst 8 tegn)"
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
            {submitting ? 'Gemmer …' : 'Skift adgangskode'}
          </button>
        </form>
      )}
    </div>
  )
}
