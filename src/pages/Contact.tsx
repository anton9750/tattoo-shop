import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import { inputClass } from '../styles/form'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/contact', { name, email, message })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kunne ikke sende beskeden. Prøv igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-14">
      <h1 className="font-display text-4xl font-bold">Kontakt</h1>
      <p className="mt-2 text-paper-dim/80">
        Spørgsmål, fejlmeldinger eller noget andet? Skriv til os herunder.
      </p>

      {sent ? (
        <div className="mt-8 rounded-sm border border-brass/40 p-6">
          <p className="font-display text-xl font-bold text-brass">Modtaget</p>
          <p className="mt-2 text-paper-dim/90">Tak for din besked. Vi svarer hurtigst muligt.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input required placeholder="Navn" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <textarea
            required
            rows={5}
            placeholder="Din besked"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-flash">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-sm bg-flash px-5 py-2.5 text-sm font-medium text-paper hover:bg-flash-dim disabled:opacity-60"
          >
            {submitting ? 'Sender …' : 'Send besked'}
          </button>
        </form>
      )}
    </div>
  )
}
