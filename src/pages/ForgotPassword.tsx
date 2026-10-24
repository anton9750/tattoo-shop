import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { inputClass } from '../styles/form'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Noget gik galt. Prøv igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-3xl font-bold">Glemt adgangskode</h1>

      {sent ? (
        <div className="mt-8 rounded-sm border border-brass/40 p-6">
          <p className="font-display text-xl font-bold text-brass">Tjek din mail</p>
          <p className="mt-2 text-paper-dim/90">
            Hvis der findes en konto med den e-mail, har vi sendt et link til at nulstille
            adgangskoden. Linket er gyldigt i 1 time.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-paper-dim/80">
            Indtast din e-mail, så sender vi et link til at nulstille din adgangskode.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <input
              required
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            {error && <p className="text-sm text-flash">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-sm bg-flash px-5 py-3 font-medium text-paper transition-colors hover:bg-flash-dim disabled:opacity-60"
            >
              {submitting ? 'Sender …' : 'Send nulstillingslink'}
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-paper-dim/70">
        <Link to="/log-ind" className="text-brass hover:underline">
          Tilbage til log ind
        </Link>
      </p>
    </div>
  )
}
