import { Link } from 'react-router-dom'

/**
 * Maersk-style brand header: a clean white surface with a thin Maersk Blue
 * accent stripe on top and a subtle steel bottom border. The 'P' logo mark
 * (public/pmark.svg) sits next to the wordmark; the whole brand links home.
 */
export default function Navbar() {
  return (
    <nav className="border-t-4 border-maersk-blue border-b border-maersk-steel/60 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-mds font-sans transition-colors"
          aria-label="Maersk PRD Studio — home"
        >
          <img
            src="/pmark.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-[6px]"
          />
          <span className="text-lg font-semibold tracking-tight text-maersk-ink group-hover:text-maersk-blue">
            Maersk PRD Studio
          </span>
        </Link>
      </div>
    </nav>
  )
}
