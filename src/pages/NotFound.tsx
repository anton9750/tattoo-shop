import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-5 py-24">
      <p className="font-display text-6xl font-extrabold text-flash">404</p>
      <p className="mt-3 text-paper-dim/80">Siden findes ikke, eller er flyttet.</p>
      <Link to="/" className="mt-6 text-brass hover:underline">
        Tilbage til forsiden
      </Link>
    </div>
  )
}
