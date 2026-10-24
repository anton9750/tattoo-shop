import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { CITIES, STYLES } from '../data/artists'
import { inputClass } from '../styles/form'

export default function ArtistSignup() {
  const { artist, register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [studio, setStudio] = useState('')
  const [city, setCity] = useState<string>(CITIES[0])
  const [styles, setStyles] = useState<string[]>([])
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')
  const [depositDkk, setDepositDkk] = useState('500')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (artist) return <Navigate to="/dashboard" replace />

  function toggleStyle(s: string) {
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!acceptedTerms) {
      setError('Du skal acceptere vilkårene for at oprette en profil.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await register({
        email,
        password,
        name,
        studio,
        city,
        styles,
        bio,
        instagram,
        depositDkk: Number(depositDkk) || 0,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kunne ikke oprette profilen. Prøv igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-display text-3xl font-bold">Opret din profil</h1>
      <p className="mt-2 text-paper-dim/80">
        Profilen går live med det samme. Du kan altid rette den, lægge motiver op og styre dine
        bookinger fra dit dashboard bagefter.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input required placeholder="Navn" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <input required placeholder="Studie" value={studio} onChange={(e) => setStudio(e.target.value)} className={inputClass} />
        </div>

        <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <div>
          <p className="mb-2 text-sm text-paper-dim/80">Dine stilarter</p>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => toggleStyle(s)}
                className={`rounded-sm border px-3 py-1 text-sm transition-colors ${
                  styles.includes(s) ? 'border-flash bg-flash/20 text-paper' : 'border-charcoal text-paper-dim/70'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={3}
          placeholder="Kort bio til din profil"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={inputClass}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Instagram, f.eks. instagram.com/dit.studie"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={inputClass}
          />
          <label className="block text-sm">
            <span className="mb-1 block text-paper-dim/80">Standard depositum (kr.)</span>
            <input
              type="number"
              min={0}
              value={depositDkk}
              onChange={(e) => setDepositDkk(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="my-2 h-px bg-charcoal/60" />

        <div className="grid gap-4 sm:grid-cols-2">
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
            placeholder="Adgangskode (mindst 8 tegn)"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-paper-dim/80">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            Jeg accepterer{' '}
            <Link to="/vilkar" className="text-brass hover:underline">
              vilkårene
            </Link>{' '}
            og{' '}
            <Link to="/privatlivspolitik" className="text-brass hover:underline">
              privatlivspolitikken
            </Link>
            .
          </span>
        </label>

        {error && <p className="text-sm text-flash">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-sm bg-flash px-5 py-3 font-medium text-paper transition-colors hover:bg-flash-dim disabled:opacity-60"
        >
          {submitting ? 'Opretter …' : 'Opret profil'}
        </button>

        <p className="text-center text-sm text-paper-dim/70">
          Har du allerede en profil?{' '}
          <Link to="/log-ind" className="text-brass hover:underline">
            Log ind
          </Link>
        </p>
      </form>
    </div>
  )
}
