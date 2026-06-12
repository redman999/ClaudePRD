import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

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

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 border border-gray-200 rounded-lg">
      <div className="h-5 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-1/4" />
    </div>
  )
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
          <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
          <Link
            to="/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
          >
            New Project
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : projects.length === 0 && !error ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No projects yet — create your first one</p>
            <Link
              to="/new"
              className="mt-4 inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              New Project
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {projects.map(project => (
              <li key={project.id}>
                <Link
                  to={`/projects/${project.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h2>
                      <p className="text-gray-500 mt-1 text-sm">{truncate(project.description, 80)}</p>
                    </div>
                    <span className="shrink-0 bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {project._count.sessions} {project._count.sessions === 1 ? 'session' : 'sessions'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Updated {formatDate(project.updatedAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </>
  )
}
