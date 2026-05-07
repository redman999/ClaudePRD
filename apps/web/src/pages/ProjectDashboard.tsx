import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SessionList from '../components/SessionList'
import PrdPreview from '../components/PrdPreview'
import { apiFetch } from '../lib/api'

interface Session {
  id: string
  name: string
  role: string
  status: 'active' | 'complete'
  createdAt: string
}

interface Project {
  id: string
  name: string
  description: string
  topic: string
  shareToken: string
  prdMarkdown: string | null
  createdAt: string
  updatedAt: string
  sessions: Session[]
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function fetchProject() {
    return apiFetch<Project>(`/api/projects/${id}`)
      .then(data => {
        setProject(data)
        return data
      })
  }

  function startPolling(data: Project) {
    if (intervalRef.current) return
    const hasActive = data.sessions.some(s => s.status === 'active')
    if (!hasActive) return
    intervalRef.current = setInterval(() => {
      fetchProject().then(updated => {
        const stillActive = updated.sessions.some(s => s.status === 'active')
        if (!stillActive && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }).catch(() => {/* swallow poll errors */})
    }, 10000)
  }

  useEffect(() => {
    fetchProject()
      .then(data => startPolling(data))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

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
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading && <Skeleton />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <code className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 truncate">
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
              <SessionList sessions={project.sessions} />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-base font-semibold text-gray-900">PRD</h2>
                {project.prdMarkdown && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`/api/projects/${project.id}/export/markdown`}
                      download
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Download PRD (.md)
                    </a>
                    <a
                      href={`/api/projects/${project.id}/export/ralph`}
                      download
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Download prd.json (ralph)
                    </a>
                  </div>
                )}
              </div>
              <PrdPreview markdown={project.prdMarkdown ?? ''} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
