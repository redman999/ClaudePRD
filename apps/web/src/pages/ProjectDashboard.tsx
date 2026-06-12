import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import SessionList from '../components/SessionList'
import PrdPreview from '../components/PrdPreview'
import { apiFetch } from '../lib/api'
import { Badge, Button, Card } from '../ui'
import { ErrorBanner, Skeleton } from '../components/feedback'

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

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3 bg-maersk-steel/30" />
      <Skeleton className="h-4 w-1/2 bg-maersk-steel/30" />
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

  const exportLinkClass =
    'inline-flex items-center rounded-mds border border-maersk-steel bg-white px-3 py-1.5 ' +
    'text-sm font-medium text-maersk-ink transition-colors hover:bg-maersk-surface ' +
    'active:bg-primary-50 focus-visible:outline-none'

  return (
    <>
      {loading && <DashboardSkeleton />}

      {error && (
        <ErrorBanner className="mb-6" onDismiss={() => setError(null)}>
          {error}
        </ErrorBanner>
      )}

      {project && (
        <div className="space-y-8">
          {/* Header block */}
          <header>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="min-w-0 text-2xl font-semibold text-maersk-ink">{project.name}</h1>
              <Badge color="blue" className="shrink-0">{project.topic}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-maersk-slate">{project.description}</p>
          </header>

          {/* Share link */}
          <Card header="Share link">
            <p className="mb-3 text-sm text-maersk-slate">
              Send this link to stakeholders so they can join the interview.
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <code className="min-w-0 flex-1 truncate rounded-mds border border-maersk-steel/50 bg-maersk-surface px-3 py-2 font-mono text-sm text-maersk-ink">
                {`${window.location.origin}/join/${project.shareToken}`}
              </code>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </Card>

          {/* Two-column responsive layout: sessions + PRD */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card header="Sessions">
              <SessionList
                sessions={project.sessions}
                onDelete={async (sessionId) => {
                  try {
                    await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
                    await fetchProject()
                  } catch (err) {
                    alert(`Couldn't discard session: ${(err as Error).message}`)
                  }
                }}
              />
            </Card>

            <Card
              header={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-maersk-ink">PRD</h2>
                  {project.prdMarkdown && (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`/api/projects/${project.id}/export/markdown`}
                        download
                        className={exportLinkClass}
                      >
                        Download PRD (.md)
                      </a>
                      <a
                        href={`/api/projects/${project.id}/export/ralph`}
                        download
                        className={exportLinkClass}
                      >
                        Download prd.json (ralph)
                      </a>
                    </div>
                  )}
                </div>
              }
            >
              <PrdPreview markdown={project.prdMarkdown ?? ''} />
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
