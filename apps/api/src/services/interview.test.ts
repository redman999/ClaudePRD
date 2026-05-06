import { describe, it, expect } from 'vitest'
import { buildInterviewSystemPrompt, extractInterviewCompletion } from './interview'

const project = { name: 'TestApp', description: 'A test project', topic: 'Enterprise SaaS' }
const session = { name: 'Alice', role: 'Developer' }

describe('buildInterviewSystemPrompt', () => {
  it('contains the project name', () => {
    expect(buildInterviewSystemPrompt(project, session)).toContain('TestApp')
  })

  it('contains the stakeholder name', () => {
    expect(buildInterviewSystemPrompt(project, session)).toContain('Alice')
  })

  it('contains the stakeholder role', () => {
    expect(buildInterviewSystemPrompt(project, session)).toContain('Developer')
  })

  it('contains [INTERVIEW_COMPLETE] marker', () => {
    expect(buildInterviewSystemPrompt(project, session)).toContain('[INTERVIEW_COMPLETE]')
  })

  it('returns a non-empty string', () => {
    const prompt = buildInterviewSystemPrompt(project, session)
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('includes role-specific guidance for developer', () => {
    const prompt = buildInterviewSystemPrompt(project, session)
    expect(prompt.toLowerCase()).toContain('technical')
  })

  it('includes role-specific guidance for business owner', () => {
    const biz = { name: 'Bob', role: 'Business Owner' }
    const prompt = buildInterviewSystemPrompt(project, biz)
    expect(prompt.toLowerCase()).toContain('roi')
  })
})

describe('extractInterviewCompletion', () => {
  it('detects [INTERVIEW_COMPLETE] and extracts trailing summary', () => {
    const result = extractInterviewCompletion('[INTERVIEW_COMPLETE]\n## Summary\nHello')
    expect(result).toEqual({ isComplete: true, summary: '## Summary\nHello' })
  })

  it('returns isComplete:false for a normal reply', () => {
    const result = extractInterviewCompletion('Just a normal reply')
    expect(result).toEqual({ isComplete: false, summary: '' })
  })

  it('handles marker mid-response with preceding text', () => {
    const text = 'Great answers!\n[INTERVIEW_COMPLETE]\n## Problem + Vision\nSomething'
    const result = extractInterviewCompletion(text)
    expect(result.isComplete).toBe(true)
    expect(result.summary).toContain('## Problem + Vision')
  })

  it('returns empty summary when marker is at end with no trailing text', () => {
    const result = extractInterviewCompletion('done[INTERVIEW_COMPLETE]')
    expect(result.isComplete).toBe(true)
    expect(result.summary).toBe('')
  })

  it('returns isComplete:false for empty string', () => {
    expect(extractInterviewCompletion('')).toEqual({ isComplete: false, summary: '' })
  })
})
