import { useEffect, useMemo, useState } from 'react'
import { api, mediaUrl } from '../api/client'
import { CITIES, STYLES } from '../data/artists'
import type { Artist, Design } from '../data/types'
import DesignTile from '../components/DesignTile'

export default function Home() {
  const [style, setStyle] = useState<string>('Alle stilarter')
  const [city, setCity] = useState<string>('Alle byer')
  const [query, setQuery] = useState('')

  const [artists, setArtists] = useState<Artist[]>([])
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([api.get<Artist[]>('/artists'), api.get<Design[]>('/designs')])
      .then(([a, d]) => {
        if (cancelled) return
        setArtists(a)
        setDesigns(d)
        setError(null)
      })
      .catch(() => !cancelled && setError('Kunne ikke hente motiver lige nu. Prøv at genindlæse siden.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const artistById = useMemo(() => new Map(artists.map((a) => [a.id, a])), [artists])

  const filtered = useMemo(() => {
    return designs.filter((d) => {
      if (style !== 'Alle stilarter' && d.style !== style) return false
      if (city !== 'Alle byer' && artistById.get(d.artistId)?.city !== city) return false
      const matchesQuery = query.trim() === '' || d.title.toLowerCase().includes(query.trim().toLowerCase())
      return matchesQuery
    })
  }, [designs, artistById, style, city, query])

  const heroDesigns = designs.slice(0, 24)

  return (
    <div>
      {/* Hero: the image wall itself is the hero */}
      <section className="relative h-[640px] overflow-hidden border-b border-charcoal/60 sm:h-[720px]">
        <div className="columns-2 gap-1 p-1 opacity-50 sm:columns-4 md:columns-6">
          {heroDesigns.map((d) => (
            <img
              key={d.id}
              src={mediaUrl(d.image)}
              alt=""
              className="mb-1 w-full grayscale-[20%] sepia-[10%]"
              style={{ aspectRatio: `${d.width} / ${d.height}` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/70 to-ink" />

        <div className="absolute inset-0 flex flex-col items-start justify-center px-5">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="max-w-xl font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
              Find din
              <br />
              næste tatovør
            </h1>
            <p className="mt-4 max-w-md text-paper-dim/90">
              Gennemse rigtige stykker fra danske tatovører efter stil og by, og book en
              konsultation direkte hos kunstneren.
            </p>

            <div className="mt-8 flex max-w-2xl flex-col gap-2 rounded-sm border border-charcoal bg-ink-soft/90 p-3 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Søg efter motiv, f.eks. 'rose' eller 'koi'"
                className="flex-1 bg-transparent px-2 py-2 text-paper placeholder:text-paper-dim/50 focus:outline-none"
              />
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="rounded-sm border border-charcoal bg-ink px-3 py-2 text-sm text-paper"
              >
                <option>Alle stilarter</option>
                {STYLES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-sm border border-charcoal bg-ink px-3 py-2 text-sm text-paper"
              >
                <option>Alle byer</option>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Browse: the flash-sheet wall */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold">
            {style === 'Alle stilarter' ? 'Alle motiver' : style}
          </h2>
          <p className="text-sm text-paper-dim/60">{filtered.length} motiver</p>
        </div>

        {error && <p className="py-16 text-center text-flash">{error}</p>}

        {!error && loading && <p className="py-16 text-center text-paper-dim/60">Henter motiver …</p>}

        {!error && !loading && (
          <div className="columns-2 gap-4 sm:columns-3 md:columns-4">
            {filtered.map((d) => {
              const artist = artistById.get(d.artistId)
              return artist ? <DesignTile key={d.id} design={d} artist={artist} /> : null
            })}
          </div>
        )}

        {!error && !loading && filtered.length === 0 && (
          <p className="py-16 text-center text-paper-dim/60">
            Ingen motiver matcher lige nu. Prøv en anden stil eller søgning.
          </p>
        )}
      </section>
    </div>
  )
}
