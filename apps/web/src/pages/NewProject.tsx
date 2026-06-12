import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Project</h1>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              disabled={submitting}
              placeholder="e.g. Customer Portal Redesign"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              disabled={submitting}
              rows={4}
              placeholder="What is this project about? What problem does it solve?"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 resize-none ${
                errors.description ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
              Topic / Focus Area <span className="text-red-500">*</span>
            </label>
            <input
              id="topic"
              name="topic"
              type="text"
              value={values.topic}
              onChange={handleChange}
              disabled={submitting}
              placeholder="e.g. Enterprise SaaS, Mobile App, Internal Tool"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 ${
                errors.topic ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.topic && <p className="text-red-600 text-xs mt-1">{errors.topic}</p>}
          </div>

          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="targetAudience"
              name="targetAudience"
              type="text"
              value={values.targetAudience}
              onChange={handleChange}
              disabled={submitting}
              placeholder="e.g. Small business owners, Enterprise IT teams"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
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
                  Creating…
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
    </div>
  )
}
