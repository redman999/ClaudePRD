import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { Badge, Button, Card, Input, Spinner } from '../ui'
import { ErrorBanner } from '../components/feedback'
import { cn } from '../ui/cn'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CoverageScores {
  problemVision: number
  usersPersonas: number
  featuresReqs: number
  techConstraints: number
}

const AREA_LABELS: { key: keyof CoverageScores; label: string }[] = [
  { key: 'problemVision', label: 'Problem & Vision' },
  { key: 'usersPersonas', label: 'Users & Personas' },
  { key: 'featuresReqs', label: 'Features & Requirements' },
  { key: 'techConstraints', label: 'Tech & Constraints' },
]

const EMPTY_COVERAGE: CoverageScores = {
  problemVision: 0,
  usersPersonas: 0,
  featuresReqs: 0,
  techConstraints: 0,
}

interface SessionInfo {
  id: string
  name: string
  role: string
  mode?: 'standard' | 'guided'
  status: 'active' | 'complete'
  messages: Message[]
  coverage?: CoverageScores
  project: {
    name: string
    description: string
    shareToken: string
  }
}

/** Maersk avatar mark for the assistant (Claude) bubbles. */
function AssistantAvatar() {
  return (
    <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-maersk-blue">
      <img src="/pmark.svg" alt="" width={28} height={28} className="h-7 w-7" />
    </div>
  )
}

export default function ChatSession() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [coverage, setCoverage] = useState<CoverageScores>(EMPTY_COVERAGE)
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoStarted = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const sendMessage = useCallback(async (content: string) => {
    setSending(true)
    setSendError(null)

    if (content !== '__START__') {
      setMessages(prev => [...prev, { role: 'user' as const, content }])
    }

    setQuickReplies([])
    try {
      const data = await apiFetch<{
        message: Message
        sessionStatus: 'active' | 'complete'
        coverage?: CoverageScores
        quickReplies?: string[]
      }>(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      setMessages(prev => [...prev, data.message])
      if (data.coverage) setCoverage(data.coverage)
      if (data.quickReplies && data.quickReplies.length > 0) {
        setQuickReplies(data.quickReplies)
      }
      if (data.sessionStatus === 'complete') {
        setSessionComplete(true)
        setShowOverlay(true)
      }
    } catch (err) {
      if (content !== '__START__') {
        setMessages(prev => prev.slice(0, -1))
      }
      setSendError((err as Error).message)
    } finally {
      setSending(false)
    }
  }, [sessionId])

  useEffect(() => {
    apiFetch<SessionInfo>(`/api/sessions/${sessionId}`)
      .then(data => {
        setSession(data)
        setMessages(data.messages)
        if (data.coverage) setCoverage(data.coverage)
        if (data.status === 'complete') setSessionComplete(true)
      })
      .catch(err => setLoadError((err as Error).message))
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    if (!session || session.status === 'complete') return
    if (messages.length > 0) return
    if (autoStarted.current) return
    autoStarted.current = true
    sendMessage('__START__')
  }, [session, messages.length, sendMessage])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setInput('')
    await sendMessage(trimmed)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-maersk-surface">
        <div className="flex items-center gap-2 text-sm text-maersk-slate">
          <Spinner size="sm" />
          Loading session…
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-maersk-surface px-4">
        <Card className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-bold text-maersk-ink">Unable to load session</h1>
          <p className="text-sm text-maersk-slate">{loadError}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-maersk-surface">
      <header className="flex-shrink-0 border-t-4 border-maersk-blue border-b border-maersk-steel/50 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-maersk-blue">
                Maersk PRD Studio Interview
              </p>
              {session?.mode === 'guided' && <Badge color="blue">Guided</Badge>}
            </div>
            {session && (
              <p className="text-sm text-maersk-slate">{session.name} · {session.role}</p>
            )}
            {session && (
              <div className="mt-1.5">
                <p className="truncate text-sm font-semibold text-maersk-ink">{session.project.name}</p>
                <p className="mt-0.5 truncate text-xs text-maersk-slate">{session.project.description}</p>
              </div>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            {sessionComplete ? (
              <Badge color="green">Complete</Badge>
            ) : (
              session && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = window.confirm(
                      'Discard this interview and start over? Your answers so far will be deleted.'
                    )
                    if (!ok) return
                    try {
                      await apiFetch(`/api/sessions/${session.id}`, { method: 'DELETE' })
                      navigate(`/join/${session.project.shareToken}`)
                    } catch (err) {
                      setSendError((err as Error).message)
                    }
                  }}
                  className="rounded text-xs text-maersk-slate underline underline-offset-2 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maersk-blue"
                >
                  Discard & start over
                </button>
              )
            )}
          </div>
        </div>
        {!sessionComplete && (
          <div className="mx-auto mt-3 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
            {AREA_LABELS.map(({ key, label }) => {
              const score = coverage[key]
              const pct = Math.min(100, Math.round((score / 3) * 100))
              const done = score >= 2
              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-medium tracking-wide">
                    <span className={done ? 'text-green-700' : 'text-maersk-slate'}>{label}</span>
                    {done && <span className="text-green-600">✓</span>}
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-maersk-steel/40">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        done ? 'bg-green-500' : 'bg-maersk-blue'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <AssistantAvatar />}
              <div
                className={cn(
                  'max-w-prose whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'rounded-tr-sm bg-maersk-blue text-white'
                    : 'rounded-tl-sm border border-maersk-steel/50 bg-white text-maersk-ink shadow-mds'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <AssistantAvatar />
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-maersk-steel/50 bg-white px-4 py-3 shadow-mds">
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-maersk-slate"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-maersk-slate"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-maersk-slate"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-maersk-steel/50 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          {sendError && (
            <ErrorBanner onDismiss={() => setSendError(null)} className="mb-3">
              {sendError}
            </ErrorBanner>
          )}
          {sessionComplete ? (
            <p className="text-center text-sm text-maersk-slate">
              Interview complete — thank you for your contribution!
            </p>
          ) : (
            <>
              {quickReplies.length > 0 && !sending && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {quickReplies.map((opt, i) => (
                    <button
                      key={`${i}-${opt}`}
                      type="button"
                      onClick={() => setInput(opt)}
                      className="rounded-full border border-maersk-blue/30 bg-primary-50 px-3 py-1.5 text-sm text-primary-700 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maersk-blue"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={sending}
                  aria-label="Your response"
                  placeholder={sending ? 'Claude is thinking…' : 'Type your response…'}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !input.trim()}>
                  Send
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <Card className="w-full max-w-md text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-maersk-ink">Interview complete!</h2>
            <p className="mb-6 text-sm text-maersk-slate">
              Thank you for your contribution. The PRD is being updated with your insights.
            </p>
            <Button onClick={() => setShowOverlay(false)}>Close</Button>
          </Card>
        </div>
      )}
    </div>
  )
}
