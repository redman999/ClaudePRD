import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EmptyState, ErrorBanner, SkeletonCard, InlineStatus } from './index'

describe('Maersk feedback components', () => {
  it('renders an EmptyState with title, description and action', () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title="No projects yet"
        description="Create your first project."
        action={<a href="/new">New Project</a>}
      />
    )
    expect(html).toContain('No projects yet')
    expect(html).toContain('Create your first project.')
    expect(html).toContain('New Project')
    // Maersk steel dashed border styling
    expect(html).toContain('border-dashed')
  })

  it('renders an ErrorBanner with an alert role and message', () => {
    const html = renderToStaticMarkup(<ErrorBanner>Failed to load projects</ErrorBanner>)
    expect(html).toContain('role="alert"')
    expect(html).toContain('Failed to load projects')
    expect(html).toContain('Something went wrong')
    expect(html).toContain('bg-red-50')
  })

  it('renders a SkeletonCard with a pulse animation', () => {
    const html = renderToStaticMarkup(<SkeletonCard />)
    expect(html).toContain('animate-pulse')
    expect(html).toContain('shadow-mds')
  })

  it('renders an InlineStatus with a polite live region', () => {
    const html = renderToStaticMarkup(<InlineStatus tone="busy">Saving…</InlineStatus>)
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('Saving…')
    expect(html).toContain('animate-spin')
  })
})
