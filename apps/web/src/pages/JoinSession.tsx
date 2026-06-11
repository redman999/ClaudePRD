import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface ProjectInfo {
  id: string
  name: string
  description: string
  topic: string
}

interface FormErrors {
  name?: string
  role?: string
}

const ROLE_SUGGESTIONS = [
  'Developer',
  'Business Owner',
  'End User',
  'Product Manager',
  'Designer',
  'Stakeholder',
]

export default function JoinSession() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [mode, setMode] = useState<'standard' | 'guided'>('standard')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/projects/join/${shareToken}`)
      .then(res => {
        if (res.status === 404) {
          setNotFound(true)
          return null
        }
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        return res.json() as Promise<ProjectInfo>
      })
      .then(data => {
        if (data) setProject(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [shareToken])

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!name.trim()) errs.name = 'Your name is required'
    if (!role.trim()) errs.role = 'Your role is required'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitting(true)
    setApiError(null)
    const trimmedName = name.trim()
    const trimmedRole = role.trim()
    try {
      // First check whether this person already has an active session and resume it.
      const lookupUrl = `/api/sessions/lookup?shareToken=${encodeURIComponent(shareToken ?? '')}&name=${encodeURIComponent(trimmedName)}&role=${encodeURIComponent(trimmedRole)}`
      const lookup = await fetch(lookupUrl)
      if (lookup.ok) {
        const existing = await lookup.json() as { id: string }
        navigate(`/session/${existing.id}`)
        return
      }
      // No existing active session — create a new one.
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareToken, name: trimmedName, role: trimmedRole, mode }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`)
      }
      const session = await res.json() as { id: string }
      navigate(`/session/${session.id}`)
    } catch (err) {
      setApiError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Project not found</h1>
          <p className="text-gray-500 text-sm">This invite link is invalid or the project no longer exists.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Maersk PRD Studio Interview</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{project!.name}</h1>
          <p className="text-gray-600 text-sm">{project!.description}</p>
          <p className="text-gray-400 text-xs mt-1">Topic: {project!.topic}</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-5 py-4 mb-6 text-sm text-indigo-800">
          You've been invited to share your perspective on this project. Claude will ask you a series of focused questions based on your role and then use your answers to help build the product requirements document.
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
              }}
              disabled={submitting}
              placeholder="e.g. Alice Smith"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Your Role <span className="text-red-500">*</span>
            </label>
            <input
              id="role"
              type="text"
              list="role-suggestions"
              value={role}
              onChange={e => {
                setRole(e.target.value)
                if (errors.role) setErrors(prev => ({ ...prev, role: undefined }))
              }}
              disabled={submitting}
              placeholder="e.g. Developer, Business Owner…"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 ${
                errors.role ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <datalist id="role-suggestions">
              {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
            </datalist>
            {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role}</p>}
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              How would you like to be interviewed?
            </p>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${mode === 'standard' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="mode"
                  value="standard"
                  checked={mode === 'standard'}
                  onChange={() => setMode('standard')}
                  disabled={submitting}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Free-form</div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Open-ended questions across topics. Best if you've been through requirements interviews before.
                  </p>
                </div>
              </label>
              <label className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${mode === 'guided' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="mode"
                  value="guided"
                  checked={mode === 'guided'}
                  onChange={() => setMode('guided')}
                  disabled={submitting}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Guided <span className="text-xs font-normal text-indigo-700">(recommended if you're new to this)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    One plain-language question at a time, with examples. Some questions have click-to-pick options.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Starting…
                </>
              ) : (
                'Start Interview'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
