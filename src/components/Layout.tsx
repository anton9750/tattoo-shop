import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CookieNotice from './CookieNotice'

const navLink =
  'px-3 py-2 text-sm font-medium transition-colors hover:text-paper aria-[current=page]:text-paper'

export default function Layout() {
  const { artist, loading } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-ink text-paper">
      <header className="sticky top-0 z-40 border-b border-charcoal/60 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight">
            Ink<span className="text-flash">Map</span>
          </Link>
          <nav className="flex items-center text-paper-dim/80">
            <NavLink to="/" className={navLink} end>
              Udforsk
            </NavLink>
            <NavLink to="/for-tatovorer" className={navLink}>
              For tatovører
            </NavLink>
            {!loading && artist && (
              <NavLink to="/dashboard" className={navLink}>
                Dashboard
              </NavLink>
            )}
            {!loading && !artist && (
              <NavLink
                to="/log-ind"
                className="ml-2 rounded-sm border border-charcoal px-3 py-1.5 text-sm hover:border-brass"
              >
                Log ind
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-charcoal/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-paper-dim/70 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg text-paper-dim">
              Ink<span className="text-flash">Map</span>
            </p>
            <p className="mt-2 max-w-xs">
              Find en tatovør efter stil og by. Book direkte — ingen mellemhandler på DM&apos;erne.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-paper-dim/50">Platform</span>
              <Link to="/om-os" className="hover:text-paper">
                Om os
              </Link>
              <Link to="/for-tatovorer" className="hover:text-paper">
                For tatovører
              </Link>
              <Link to="/kontakt" className="hover:text-paper">
                Kontakt
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-paper-dim/50">Juridisk</span>
              <Link to="/vilkar" className="hover:text-paper">
                Vilkår og betingelser
              </Link>
              <Link to="/privatlivspolitik" className="hover:text-paper">
                Privatlivspolitik
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <CookieNotice />
    </div>
  )
}
