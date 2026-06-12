import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { Button, Card, Input, Label, Textarea } from '../ui'
import { ErrorBanner } from '../components/feedback'

interface FormValues {
  name: string
  description: string
  topic: string
  targetAudience: string
}

interface FormErrors {
  name?: string
  description?: string
  topic?: string
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.name.trim()) errors.name = 'Project name is required'
  if (!values.description.trim()) errors.description = 'Description is required'
  if (!values.topic.trim()) errors.topic = 'Topic / Focus Area is required'
  return errors
}

export default function NewProject() {
  const navigate = useNavigate()
  const [values, setValues] = useState<FormValues>({
    name: '',
    description: '',
    topic: '',
    targetAudience: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitting(true)
    setApiError(null)
    try {
      const body: Record<string, string> = {
        name: values.name.trim(),
        description: values.description.trim(),
        topic: values.topic.trim(),
      }
      if (values.targetAudience.trim()) {
        body.targetAudience = values.targetAudience.trim()
      }
      const project = await apiFetch<{ id: string }>('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      navigate(`/projects/${project.id}`)
    } catch (err) {
      setApiError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-maersk-ink">New Project</h1>
      <p className="mb-6 text-sm text-maersk-slate">
        Set up a project, then share its link with stakeholders to gather their input.
      </p>

      {apiError && (
        <ErrorBanner onDismiss={() => setApiError(null)} className="mb-6">
          {apiError}
        </ErrorBanner>
      )}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <Label htmlFor="name" required>
              Project Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              disabled={submitting}
              error={!!errors.name}
              placeholder="e.g. Customer Portal Redesign"
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
            <Label htmlFor="description" required>
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              disabled={submitting}
              error={!!errors.description}
              rows={4}
              placeholder="What is this project about? What problem does it solve?"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-xs text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="topic" required>
              Topic / Focus Area
            </Label>
            <Input
              id="topic"
              name="topic"
              type="text"
              value={values.topic}
              onChange={handleChange}
              disabled={submitting}
              error={!!errors.topic}
              placeholder="e.g. Enterprise SaaS, Mobile App, Internal Tool"
              aria-invalid={!!errors.topic}
              aria-describedby={errors.topic ? 'topic-error' : undefined}
            />
            {errors.topic && (
              <p id="topic-error" className="mt-1 text-xs text-red-600">
                {errors.topic}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="targetAudience">
              Target Audience{' '}
              <span className="font-normal text-maersk-slate">(optional)</span>
            </Label>
            <Input
              id="targetAudience"
              name="targetAudience"
              type="text"
              value={values.targetAudience}
              onChange={handleChange}
              disabled={submitting}
              placeholder="e.g. Small business owners, Enterprise IT teams"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
