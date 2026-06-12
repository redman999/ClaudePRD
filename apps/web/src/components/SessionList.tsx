import { Link } from 'react-router-dom'
import { Badge } from '../ui'

interface Session {
  id: string
  name: string
  role: string
  status: 'active' | 'complete'
  createdAt: string
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  sessions: Session[]
  onDelete?: (id: string) => Promise<void> | void
}

export default function SessionList({ sessions, onDelete }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-maersk-slate italic">
        No sessions yet — share the link above to invite stakeholders.
      </p>
    )
  }

  const total = sessions.length
  const complete = sessions.filter(s => s.status === 'complete').length

  async function handleDelete(e: React.MouseEvent, s: Session) {
    e.preventDefault()
    e.stopPropagation()
    if (!onDelete) return
    const ok = window.confirm(
      `Discard ${s.name}'s in-progress interview? This cannot be undone.`
    )
    if (!ok) return
    await onDelete(s.id)
  }

  return (
    <div>
      <p className="text-sm text-maersk-slate mb-3">
        {total} session{total !== 1 ? 's' : ''} — {complete} complete
      </p>
      <ul className="space-y-2">
        {sessions.map(s => (
          <li key={s.id}>
            <Link
              to={`/session/${s.id}`}
              className="group flex items-center justify-between rounded-mds border border-maersk-steel/40 bg-white px-4 py-3 transition-colors hover:border-maersk-blue hover:bg-primary-50"
            >
              <div className="min-w-0">
                <span className="font-medium text-maersk-ink">{s.name}</span>
                <span className="ml-2 text-sm text-maersk-slate">{s.role}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-maersk-slate">{relativeTime(s.createdAt)}</span>
                {s.status === 'complete' ? (
                  <Badge color="green">Complete</Badge>
                ) : (
                  <Badge color="amber">Active</Badge>
                )}
                {s.status === 'active' && onDelete && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, s)}
                    aria-label={`Discard ${s.name}'s interview`}
                    title="Discard this interview"
                    className="rounded px-1 text-xs text-maersk-slate transition-colors hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
