import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { Badge, Button, Card } from '../ui'
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="group block h-full rounded-mds focus-visible:outline-none"
              >
                <Card
                  padded={false}
                  className="flex h-full flex-col p-5 transition-all group-hover:border-maersk-blue group-hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 truncate text-lg font-semibold text-maersk-ink">
                      {project.name}
                    </h2>
                    <Badge color="blue" className="shrink-0">
                      {project._count.sessions} {project._count.sessions === 1 ? 'session' : 'sessions'}
                    </Badge>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-maersk-slate">
                    {truncate(project.description, 110)}
                  </p>
                  <p className="mt-4 text-xs text-maersk-slate/80">Updated {formatDate(project.updatedAt)}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
