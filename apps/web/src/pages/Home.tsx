import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { Button } from '../ui'
import { EmptyState, ErrorBanner, SkeletonCard } from '../components/feedback'

interface ProjectListItem {
  id: string
  name: string
  description: string
  topic: string
  updatedAt: string
  _count: { sessions: number }
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + '…'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Home() {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<ProjectListItem[]>('/api/projects')
      .then(data => setProjects(data))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-maersk-ink">Projects</h1>
        <Link to="/new">
          <Button variant="primary" size="sm">
            New Project
          </Button>
        </Link>
      </div>

      {error && (
        <ErrorBanner className="mb-6" onDismiss={() => setError(null)}>
          {error}
        </ErrorBanner>
      )}

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : projects.length === 0 && !error ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start gathering stakeholder interviews and building a shared PRD."
          action={
            <Link to="/new">
              <Button variant="primary">New Project</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {projects.map(project => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="block rounded-mds border border-maersk-steel/50 bg-white p-5 shadow-mds transition-all hover:border-maersk-blue hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-maersk-ink">{project.name}</h2>
                    <p className="mt-1 text-sm text-maersk-slate">{truncate(project.description, 80)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                    {project._count.sessions} {project._count.sessions === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                <p className="mt-3 text-xs text-maersk-slate/80">Updated {formatDate(project.updatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
