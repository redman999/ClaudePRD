import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button, Badge, Card, Input, Label, Spinner, cn } from './index'

describe('Maersk UI primitives', () => {
  it('renders a primary Button in the loading state', () => {
    const html = renderToStaticMarkup(
      <Button variant="primary" loading>
        Create Project
      </Button>
    )
    // Mounts and renders its label
    expect(html).toContain('Create Project')
    // Loading => spinner present + button disabled/busy
    expect(html).toContain('animate-spin')
    expect(html).toContain('disabled')
    expect(html).toContain('aria-busy="true"')
    // Maersk Blue solid primary styling
    expect(html).toContain('bg-maersk-blue')
  })

  it('renders a Badge with status color', () => {
    const html = renderToStaticMarkup(<Badge color="green">Complete</Badge>)
    expect(html).toContain('Complete')
    expect(html).toContain('rounded-full')
    expect(html).toContain('text-green-700')
  })

  it('renders a Card with a header and body', () => {
    const html = renderToStaticMarkup(<Card header="Sessions">body content</Card>)
    expect(html).toContain('Sessions')
    expect(html).toContain('body content')
    expect(html).toContain('shadow-mds')
  })

  it('renders an Input + Label with the error state', () => {
    const html = renderToStaticMarkup(
      <>
        <Label htmlFor="name" required>
          Name
        </Label>
        <Input id="name" error placeholder="Project name" />
      </>
    )
    expect(html).toContain('Name')
    expect(html).toContain('Project name')
    expect(html).toContain('border-red-400')
  })

  it('renders a Spinner with an accessible role', () => {
    const html = renderToStaticMarkup(<Spinner />)
    expect(html).toContain('role="status"')
    expect(html).toContain('animate-spin')
  })
})

describe('cn helper', () => {
  it('joins truthy classes and skips falsy ones', () => {
    expect(cn('a', false, undefined, 'b', null, 0 as unknown as string)).toBe('a b')
  })

  it('supports object and array syntax', () => {
    expect(cn('base', { active: true, hidden: false }, ['x', 'y'])).toBe('base active x y')
  })
})
