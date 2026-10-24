import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import type { Artist } from '../data/types'
import { inputClass } from '../styles/form'

interface Props {
  artist: Artist
  preselectedDesignId?: string
  onClose: () => void
}

export default function BookingForm({ artist, preselectedDesignId, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'confirmed'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [placement, setPlacement] = useState('')
  const [size, setSize] = useState('')
  const [preferredDates, setPreferredDates] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/bookings', {
        artistId: artist.id,
        designId: preselectedDesignId,
        name,
        email,
        phone,
        placement,
        size,
        preferredDates,
        message,
      })
      setStep('confirmed')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kunne ikke sende forespørgslen. Prøv igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-sm border border-charcoal bg-ink-soft p-6 sm:p-8"
      >
        {step === 'form' ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Book hos {artist.name}</h2>
                <p className="mt-1 text-sm text-paper-dim/70">
                  Depositum {artist.depositDkk} kr. trækkes først, når {artist.name.split(' ')[0]}{' '}
                  har bekræftet tiden.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Luk"
                className="shrink-0 text-paper-dim/60 hover:text-paper"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Navn" required>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Telefon" required>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="E-mail" required>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Placering på kroppen" required>
                  <input
                    required
                    placeholder="f.eks. underarm"
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Størrelse (cirka)" required>
                  <input
                    required
                    placeholder="f.eks. 10x10 cm"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Foretrukne datoer">
                <input
                  placeholder="f.eks. uge 46-48"
                  value={preferredDates}
                  onChange={(e) => setPreferredDates(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Besked til kunstneren">
                <textarea
                  rows={3}
                  placeholder="Beskriv motivet, eller link til reference"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-sm bg-flash px-5 py-3 font-medium text-paper transition-colors hover:bg-flash-dim disabled:opacity-60"
              >
                {submitting ? 'Sender …' : 'Send booking-forespørgsel'}
              </button>

              {error && <p className="text-sm text-flash">{error}</p>}
            </form>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="font-display text-3xl font-bold text-brass">Sendt</p>
            <p className="mt-3 text-paper-dim/90">
              {artist.name} vender tilbage på {email || 'din mail'} inden for 2-3 dage med en
              bekræftelse og et link til at betale depositum på {artist.depositDkk} kr.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-sm border border-charcoal px-5 py-2 text-sm hover:border-brass"
            >
              Luk
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-paper-dim/80">
        {label}
        {required && <span className="text-flash"> *</span>}
      </span>
      {children}
    </label>
  )
}
