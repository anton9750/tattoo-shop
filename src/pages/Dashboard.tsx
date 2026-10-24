import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError, mediaUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { STYLES } from '../data/artists'
import type { BookingRequest, BookingStatus, Design } from '../data/types'
import { inputClass } from '../styles/form'

type Tab = 'profil' | 'motiver' | 'bookinger'

export default function Dashboard() {
  const { artist, logout, refresh } = useAuth()
  const [tab, setTab] = useState<Tab>('bookinger')

  if (!artist) return null

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-paper-dim/60">Dashboard</p>
          <h1 className="font-display text-3xl font-bold">{artist.name}</h1>
        </div>
        <button onClick={logout} className="rounded-sm border border-charcoal px-4 py-2 text-sm hover:border-brass">
          Log ud
        </button>
      </div>

      <div className="mt-6 flex gap-1 border-b border-charcoal/60">
        {(
          [
            ['bookinger', 'Bookinger'],
            ['profil', 'Profil'],
            ['motiver', 'Motiver'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'border-b-2 border-flash text-paper' : 'text-paper-dim/60 hover:text-paper'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'bookinger' && <BookingsTab />}
        {tab === 'profil' && <ProfileTab onSaved={refresh} />}
        {tab === 'motiver' && <DesignsTab />}
      </div>
    </div>
  )
}

function BookingsTab() {
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api
      .get<BookingRequest[]>('/me/bookings')
      .then(setBookings)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function updateStatus(id: string, status: BookingStatus) {
    const updated = await api.put<BookingRequest>(`/me/bookings/${id}`, { status })
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)))
  }

  if (loading) return <p className="text-paper-dim/60">Henter bookinger …</p>
  if (bookings.length === 0) {
    return <p className="text-paper-dim/60">Ingen booking-forespørgsler endnu.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {bookings.map((b) => (
        <div key={b.id} className="rounded-sm border border-charcoal/60 bg-ink-soft p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-display text-lg font-semibold">{b.name}</p>
              <p className="text-sm text-paper-dim/70">
                {b.email} · {b.phone}
              </p>
            </div>
            <StatusBadge status={b.status} />
          </div>

          <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-paper-dim/90 sm:grid-cols-2">
            <div>
              <dt className="text-paper-dim/60">Placering</dt>
              <dd>{b.placement}</dd>
            </div>
            <div>
              <dt className="text-paper-dim/60">Størrelse</dt>
              <dd>{b.size}</dd>
            </div>
            {b.preferredDates && (
              <div>
                <dt className="text-paper-dim/60">Ønsket periode</dt>
                <dd>{b.preferredDates}</dd>
              </div>
            )}
          </dl>

          {b.message && <p className="mt-3 text-sm text-paper-dim/90">"{b.message}"</p>}

          {b.status === 'ny' && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => updateStatus(b.id, 'bekræftet')}
                className="rounded-sm bg-flash px-4 py-2 text-sm font-medium text-paper hover:bg-flash-dim"
              >
                Bekræft
              </button>
              <button
                onClick={() => updateStatus(b.id, 'afvist')}
                className="rounded-sm border border-charcoal px-4 py-2 text-sm hover:border-brass"
              >
                Afvis
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styleFor: Record<BookingStatus, string> = {
    ny: 'border-brass/50 text-brass',
    bekræftet: 'border-green-600/50 text-green-500',
    afvist: 'border-paper-dim/40 text-paper-dim/60',
  }
  return <span className={`rounded-sm border px-2 py-1 text-xs ${styleFor[status]}`}>{status}</span>
}

function ProfileTab({ onSaved }: { onSaved: () => void }) {
  const { artist } = useAuth()
  const [name, setName] = useState(artist?.name ?? '')
  const [studio, setStudio] = useState(artist?.studio ?? '')
  const [city, setCity] = useState(artist?.city ?? '')
  const [styles, setStyles] = useState<string[]>(artist?.styles ?? [])
  const [bio, setBio] = useState(artist?.bio ?? '')
  const [instagram, setInstagram] = useState(artist?.instagram ?? '')
  const [bookingLeadTime, setBookingLeadTime] = useState(artist?.bookingLeadTime ?? '')
  const [depositDkk, setDepositDkk] = useState(String(artist?.depositDkk ?? 0))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function toggleStyle(s: string) {
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await api.put('/me', { name, studio, city, styles, bio, instagram, bookingLeadTime, depositDkk: Number(depositDkk) || 0 })
      onSaved()
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kunne ikke gemme ændringerne.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Navn" className={inputClass} />
        <input value={studio} onChange={(e) => setStudio(e.target.value)} placeholder="Studie" className={inputClass} />
      </div>
      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="By" className={inputClass} />

      <div>
        <p className="mb-2 text-sm text-paper-dim/80">Stilarter</p>
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

      <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" className={inputClass} />

      <div className="grid gap-4 sm:grid-cols-2">
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram" className={inputClass} />
        <input
          value={bookingLeadTime}
          onChange={(e) => setBookingLeadTime(e.target.value)}
          placeholder="Ventetid, f.eks. 'Ventetid: ca. 4 uger'"
          className={inputClass}
        />
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-paper-dim/80">Depositum (kr.)</span>
        <input type="number" min={0} value={depositDkk} onChange={(e) => setDepositDkk(e.target.value)} className={inputClass} />
      </label>

      {error && <p className="text-sm text-flash">{error}</p>}
      {saved && <p className="text-sm text-brass">Gemt.</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-sm bg-flash px-5 py-2.5 text-sm font-medium text-paper hover:bg-flash-dim disabled:opacity-60"
      >
        {saving ? 'Gemmer …' : 'Gem ændringer'}
      </button>
    </form>
  )
}

function DesignsTab() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [style, setStyle] = useState<string>(STYLES[0])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api
      .get<Design[]>('/me/designs')
      .then(setDesigns)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleUpload(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Vælg et billede.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('style', style)
      formData.append('image', file)
      const design = await api.post<Design>('/me/designs', formData)
      setDesigns((prev) => [design, ...prev])
      setTitle('')
      setFile(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kunne ikke uploade motivet.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/me/designs/${id}`)
    setDesigns((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div>
      <form onSubmit={handleUpload} className="flex max-w-xl flex-col gap-4 rounded-sm border border-charcoal/60 bg-ink-soft p-4">
        <p className="font-display text-lg font-semibold">Upload nyt motiv</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" className={inputClass} />
          <select value={style} onChange={(e) => setStyle(e.target.value)} className={inputClass}>
            {STYLES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <input
          required
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-paper-dim/80 file:mr-3 file:rounded-sm file:border file:border-charcoal file:bg-ink file:px-3 file:py-1.5 file:text-paper"
        />
        {error && <p className="text-sm text-flash">{error}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="self-start rounded-sm bg-flash px-5 py-2.5 text-sm font-medium text-paper hover:bg-flash-dim disabled:opacity-60"
        >
          {uploading ? 'Uploader …' : 'Upload'}
        </button>
      </form>

      <h2 className="mt-8 mb-3 font-display text-lg font-semibold">Dine motiver</h2>
      {loading ? (
        <p className="text-paper-dim/60">Henter …</p>
      ) : designs.length === 0 ? (
        <p className="text-paper-dim/60">Ingen motiver endnu — upload dit første ovenfor.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {designs.map((d) => (
            <div key={d.id} className="group relative overflow-hidden rounded-sm border border-charcoal/60">
              <img src={mediaUrl(d.image)} alt={d.title} className="aspect-square w-full object-cover" />
              <button
                onClick={() => handleDelete(d.id)}
                className="absolute right-1 top-1 rounded-sm bg-ink/90 px-2 py-1 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100"
              >
                Slet
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
