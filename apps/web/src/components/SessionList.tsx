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
}

export default function SessionList({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No sessions yet — share the link above to invite stakeholders.
      </p>
    )
  }

  const total = sessions.length
  const complete = sessions.filter(s => s.status === 'complete').length

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        {total} session{total !== 1 ? 's' : ''} — {complete} complete
      </p>
      <ul className="space-y-2">
        {sessions.map(s => (
          <li key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div>
              <span className="font-medium text-gray-900">{s.name}</span>
              <span className="text-gray-500 text-sm ml-2">{s.role}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{relativeTime(s.createdAt)}</span>
              {s.status === 'complete' ? (
                <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Complete
                </span>
              ) : (
                <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
