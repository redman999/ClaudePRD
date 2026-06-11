import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
        <Link to="/" className="text-indigo-600 font-bold text-lg tracking-tight hover:text-indigo-800 transition-colors">
          Maersk PRD Studio
        </Link>
      </div>
    </nav>
  )
}
