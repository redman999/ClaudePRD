import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

interface Project {
  id: string
  name: string
  description: string
  topic: string
  shareToken: string
  createdAt: string
  updatedAt: string
  sessions: unknown[]
  prdMarkdown: string | null
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
    </div>
  )
}

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Project not found' : 'Failed to load project')
        return r.json() as Promise<Project>
      })
      .then(data => setProject(data))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  function handleCopy() {
    if (!project) return
    const shareLink = `${window.location.origin}/join/${project.shareToken}`
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            ← ClaudePRD
          </Link>
        </div>

        {loading && <Skeleton />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {project && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-2">{project.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium text-gray-700">Topic:</span> {project.topic}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Share Link</h2>
              <p className="text-sm text-gray-600 mb-3">
                Send this link to stakeholders so they can join the interview.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 truncate">
                  {`${window.location.origin}/join/${project.shareToken}`}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Sessions</h2>
              <p className="text-sm text-gray-500 italic">
                No sessions yet — share the link above to invite stakeholders.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">PRD</h2>
              <p className="text-sm text-gray-500 italic">
                PRD will appear here once sessions complete.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
