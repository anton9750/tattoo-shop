import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <Link to="/" className="text-sm text-paper-dim/70 hover:text-paper">
        ← Tilbage til forsiden
      </Link>

      <h1 className="mt-6 font-display text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-paper-dim/60">Senest opdateret {updated}</p>

      <div className="legal mt-8 flex flex-col gap-4 text-paper-dim/90 [&_a]:text-brass [&_a:hover]:underline [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-paper [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </div>
  )
}
