import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SessionInfo {
  id: string
  name: string
  role: string
  status: 'active' | 'complete'
  messages: Message[]
}

export default function ChatSession() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
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

    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? `Server error ${res.status}`)
      }
      const data = await res.json() as { message: Message; sessionStatus: 'active' | 'complete' }
      setMessages(prev => [...prev, data.message])
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
    fetch(`/api/sessions/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        return res.json() as Promise<SessionInfo>
      })
      .then(data => {
        setSession(data)
        setMessages(data.messages)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading session…</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Session not found</h1>
          <p className="text-gray-500 text-sm">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">ClaudePRD Interview</p>
            {session && (
              <p className="text-sm text-gray-600">{session.name} · {session.role}</p>
            )}
          </div>
          {sessionComplete && (
            <span className="inline-flex items-center text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              Complete
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center mr-2 mt-1">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
              )}
              <div
                className={`max-w-prose px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center mr-2 mt-1">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          {sendError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">
              {sendError}
            </div>
          )}
          {sessionComplete ? (
            <p className="text-center text-gray-400 text-sm">
              Interview complete — thank you for your contribution!
            </p>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
                placeholder="Type your response…"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>

      {showOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Interview complete!</h2>
            <p className="text-gray-600 text-sm mb-6">
              Thank you for your contribution. The PRD is being updated with your insights.
            </p>
            <button
              onClick={() => setShowOverlay(false)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
