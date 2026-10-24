import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const KEY = 'inkmap.cookie-notice-seen'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // storage unavailable — banner will just show again next visit
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-charcoal bg-ink-soft px-5 py-4">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-paper-dim/90">
          InkMap bruger kun teknisk nødvendige cookies til at holde dig logget ind — ingen
          sporing eller markedsføring. Læs mere i{' '}
          <Link to="/privatlivspolitik" className="text-brass hover:underline">
            privatlivspolitikken
          </Link>
          .
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-sm bg-flash px-4 py-2 text-sm font-medium text-paper hover:bg-flash-dim"
        >
          Okay
        </button>
      </div>
    </div>
  )
}
