import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Artist } from '../data/types'

export default function ForArtists() {
  const [artists, setArtists] = useState<Artist[]>([])

  useEffect(() => {
    api
      .get<Artist[]>('/artists')
      .then(setArtists)
      .catch(() => setArtists([]))
  }, [])

  const avgDeposit = artists.length
    ? Math.round(artists.reduce((s, a) => s + a.depositDkk, 0) / artists.length)
    : null

  return (
    <div>
      <section className="border-b border-charcoal/60 px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Dine bookinger, uden at bo i dine DM&apos;er
          </h1>
          <p className="mt-5 max-w-xl text-lg text-paper-dim/90">
            InkMap viser dit arbejde til folk, der søger efter netop din stil og by — og sender
            dem direkte til en booking-formular med depositum, i stedet for endnu en besked, du
            skal svare på midt i en session.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/for-tatovorer/opret"
              className="rounded-sm bg-flash px-6 py-3 font-medium text-paper hover:bg-flash-dim"
            >
              Opret din profil nu
            </Link>
            <a
              href="#sadan-virker-det"
              className="rounded-sm border border-charcoal px-6 py-3 font-medium hover:border-brass"
            >
              Se hvordan det virker
            </a>
          </div>
        </div>
      </section>

      <section id="sadan-virker-det" className="px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl font-bold">Hvad du får</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <Benefit
              title="En profil folk finder"
              body="Dit arbejde listes under din stil og din by, så det er folk, der allerede leder efter netop det, som ser det — ikke et tilfældigt feed."
            />
            <Benefit
              title="Booking med depositum"
              body="Besøgende udfylder placering, størrelse og ønsket periode, før de når dig. Du ser kun seriøse forespørgsler, og depositum sikrer no-shows."
            />
            <Benefit
              title="Du styrer prisen selv"
              body="Du sætter dit eget depositum og din egen ventetid, og styrer alt fra dit eget dashboard — profil, motiver og bookinger."
            />
          </div>

          {avgDeposit !== null && (
            <div className="mt-12 rounded-sm border border-charcoal bg-ink-soft p-6">
              <p className="text-sm text-paper-dim/70">Til reference</p>
              <p className="mt-1 text-paper-dim/90">
                De {artists.length} tatovører, der allerede er på InkMap, tager i gennemsnit{' '}
                <span className="text-brass">{avgDeposit} kr.</span> i depositum pr. booking.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-charcoal/60 px-5 py-16">
        <div className="mx-auto max-w-lg">
          <h2 className="font-display text-2xl font-bold">Klar til at komme i gang?</h2>
          <p className="mt-2 text-paper-dim/80">
            Ingen opstartsgebyr. Din profil går live med det samme, og du kan rette den og lægge
            motiver op bagefter.
          </p>
          <Link
            to="/for-tatovorer/opret"
            className="mt-6 inline-block rounded-sm bg-flash px-6 py-3 font-medium text-paper hover:bg-flash-dim"
          >
            Opret din profil
          </Link>
        </div>
      </section>
    </div>
  )
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-brass/40 pt-4">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-paper-dim/80">{body}</p>
    </div>
  )
}
