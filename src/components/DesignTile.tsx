import { Link } from 'react-router-dom'
import { mediaUrl } from '../api/client'
import type { Artist, Design } from '../data/types'

export default function DesignTile({ design, artist }: { design: Design; artist: Artist }) {
  return (
    <Link
      to={`/tatovor/${artist.id}?motiv=${design.id}`}
      className="group relative mb-4 block w-full overflow-hidden break-inside-avoid rounded-sm border border-charcoal/60 bg-ink-soft"
    >
      <img
        src={mediaUrl(design.image)}
        alt={`${design.title} — ${design.style} af ${artist.name}`}
        width={design.width}
        height={design.height}
        loading="lazy"
        className="w-full grayscale-[15%] contrast-110 sepia-[8%] transition-transform duration-300 group-hover:scale-[1.03]"
        style={{ aspectRatio: `${design.width} / ${design.height}` }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink/95 to-transparent p-3 pt-10 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-paper">{design.title}</p>
          <p className="truncate text-xs text-paper-dim/80">
            {artist.name} · {artist.city}
          </p>
        </div>
        <span className="shrink-0 rounded-sm bg-flash px-2 py-1 text-xs font-medium text-paper">
          Book
        </span>
      </div>
    </Link>
  )
}
