import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api, mediaUrl } from '../api/client'
import type { Artist, Design } from '../data/types'
import BookingForm from '../components/BookingForm'

export default function ArtistProfile() {
  const { artistId } = useParams()
  const [params] = useSearchParams()

  const [artist, setArtist] = useState<Artist | null>(null)
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showBooking, setShowBooking] = useState(Boolean(params.get('motiv')))

  useEffect(() => {
    if (!artistId) return
    let cancelled = false
    setLoading(true)
    Promise.all([api.get<Artist>(`/artists/${artistId}`), api.get<Design[]>(`/designs?artistId=${artistId}`)])
      .then(([a, d]) => {
        if (cancelled) return
        setArtist(a)
        setDesigns(d)
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [artistId])

  if (loading) {
    return <p className="mx-auto max-w-5xl px-5 py-20 text-center text-paper-dim/60">Henter profil …</p>
  }

  if (notFound || !artist) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-20 text-center">
        <p className="text-paper-dim/80">Denne tatovør findes ikke.</p>
        <Link to="/" className="mt-4 inline-block text-brass hover:underline">
          Tilbage til udforsk
        </Link>
      </div>
    )
  }

  const preselectedDesignId = params.get('motiv') ?? undefined
  const preselected = designs.find((d) => d.id === preselectedDesignId)

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/" className="text-sm text-paper-dim/70 hover:text-paper">
        ← Tilbage til udforsk
      </Link>

      <div className="mt-6 flex flex-col gap-6 border-b border-charcoal/60 pb-8 sm:flex-row sm:items-start">
        <img
          src={mediaUrl(artist.avatar)}
          alt={artist.name}
          className="h-28 w-28 shrink-0 rounded-sm border border-charcoal object-cover grayscale-[20%]"
        />
        <div className="flex-1">
          <h1 className="font-display text-4xl font-extrabold">{artist.name}</h1>
          <p className="mt-1 text-paper-dim/80">
            {artist.studio} · {artist.city}
          </p>
          {artist.bio && <p className="mt-3 max-w-2xl text-paper-dim/90">{artist.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {artist.styles.map((s) => (
              <span key={s} className="rounded-sm border border-brass/40 px-2 py-1 text-xs text-brass">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-paper-dim/70">
            {artist.reviewCount > 0 && (
              <span>
                ★ {artist.rating} ({artist.reviewCount} anmeldelser)
              </span>
            )}
            <span>{artist.bookingLeadTime}</span>
            {artist.instagram && (
              <a
                href={`https://${artist.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="text-brass hover:underline"
              >
                @{artist.instagram.split('/').pop()}
              </a>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowBooking(true)}
          className="shrink-0 self-start rounded-sm bg-flash px-5 py-3 font-medium text-paper transition-colors hover:bg-flash-dim"
        >
          Book konsultation
        </button>
      </div>

      <h2 className="mt-10 mb-4 font-display text-xl font-bold">Portfolio</h2>
      {designs.length === 0 ? (
        <p className="text-paper-dim/60">Ingen motiver uploadet endnu.</p>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3">
          {designs.map((d) => (
            <button
              key={d.id}
              onClick={() => setShowBooking(true)}
              className="mb-4 block w-full overflow-hidden rounded-sm border border-charcoal/60 text-left"
            >
              <img
                src={mediaUrl(d.image)}
                alt={d.title}
                className="w-full grayscale-[15%] sepia-[8%]"
                style={{ aspectRatio: `${d.width} / ${d.height}` }}
              />
            </button>
          ))}
        </div>
      )}

      {showBooking && (
        <BookingForm artist={artist} preselectedDesignId={preselected?.id} onClose={() => setShowBooking(false)} />
      )}
    </div>
  )
}
