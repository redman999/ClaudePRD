import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Input, Label } from '../ui'
import { ErrorBanner } from '../components/feedback'
import { cn } from '../ui/cn'

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
      <div className="flex min-h-screen items-center justify-center bg-maersk-surface">
        <div className="text-sm text-maersk-slate">Loading…</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-maersk-surface px-4">
        <Card className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-bold text-maersk-ink">Project not found</h1>
          <p className="text-sm text-maersk-slate">
            This invite link is invalid or the project no longer exists.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-maersk-surface">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2.5">
            <img
              src="/pmark.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-[6px]"
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-maersk-blue">
              Maersk PRD Studio Interview
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-maersk-ink">{project!.name}</h1>
          <p className="text-sm text-maersk-slate">{project!.description}</p>
          <p className="mt-1 text-xs text-maersk-slate/80">Topic: {project!.topic}</p>
        </div>

        <div className="mb-6 rounded-mds border border-maersk-blue/20 bg-primary-50 px-5 py-4 text-sm text-maersk-ink">
          You've been invited to share your perspective on this project. Claude will ask you a
          series of focused questions based on your role and then use your answers to help build
          the product requirements document.
        </div>

        {apiError && (
          <ErrorBanner onDismiss={() => setApiError(null)} className="mb-5">
            {apiError}
          </ErrorBanner>
        )}

        <Card>
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <Label htmlFor="name" required>
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
                }}
                disabled={submitting}
                error={!!errors.name}
                placeholder="e.g. Alice Smith"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-xs text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="role" required>
                Your Role
              </Label>
              <Input
                id="role"
                type="text"
                list="role-suggestions"
                value={role}
                onChange={e => {
                  setRole(e.target.value)
                  if (errors.role) setErrors(prev => ({ ...prev, role: undefined }))
                }}
                disabled={submitting}
                error={!!errors.role}
                placeholder="e.g. Developer, Business Owner…"
                aria-invalid={!!errors.role}
                aria-describedby={errors.role ? 'role-error' : undefined}
              />
              <datalist id="role-suggestions">
                {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
              </datalist>
              {errors.role && (
                <p id="role-error" className="mt-1 text-xs text-red-600">
                  {errors.role}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 block text-sm font-medium text-maersk-ink">
                How would you like to be interviewed?
              </p>
              <div className="space-y-2">
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-mds border p-3 transition-colors',
                    mode === 'standard'
                      ? 'border-maersk-blue bg-primary-50'
                      : 'border-maersk-steel hover:bg-maersk-surface'
                  )}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="standard"
                    checked={mode === 'standard'}
                    onChange={() => setMode('standard')}
                    disabled={submitting}
                    className="mt-0.5 accent-maersk-blue"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-maersk-ink">Free-form</div>
                    <p className="mt-0.5 text-xs text-maersk-slate">
                      Open-ended questions across topics. Best if you've been through requirements
                      interviews before.
                    </p>
                  </div>
                </label>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-mds border p-3 transition-colors',
                    mode === 'guided'
                      ? 'border-maersk-blue bg-primary-50'
                      : 'border-maersk-steel hover:bg-maersk-surface'
                  )}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="guided"
                    checked={mode === 'guided'}
                    onChange={() => setMode('guided')}
                    disabled={submitting}
                    className="mt-0.5 accent-maersk-blue"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-maersk-ink">
                      Guided{' '}
                      <span className="text-xs font-normal text-maersk-blue">
                        (recommended if you're new to this)
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-maersk-slate">
                      One plain-language question at a time, with examples. Some questions have
                      click-to-pick options.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={submitting} className="w-full">
                {submitting ? 'Starting…' : 'Start Interview'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
