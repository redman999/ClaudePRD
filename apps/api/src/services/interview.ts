interface ProjectContext {
  name: string
  description: string
  topic: string
}

interface SessionContext {
  name: string
  role: string
}

const ROLE_GUIDANCE: Record<string, string> = {
  developer: `Focus on technical requirements, non-functional requirements (NFRs), architecture constraints, scalability, security, integrations, and tech debt. Ask about existing systems, APIs, data models, and deployment environment.`,
  'business owner': `Focus on business goals, ROI, success metrics, revenue impact, competitive landscape, budget constraints, and timelines. Ask for concrete numbers and target outcomes.`,
  'end user': `Focus on daily workflows, pain points, usability requirements, accessibility, and what a successful experience looks like. Ask for real examples from their day-to-day.`,
  'product manager': `Focus on scope boundaries, prioritization, risks, dependencies, launch criteria, and rollout plan. Ask what is explicitly out of scope and what the MVP looks like.`,
  designer: `Focus on UX requirements, user journeys, accessibility needs, brand constraints, and responsive/platform targets. Ask about edge cases and error states.`,
  stakeholder: `Focus on high-level goals, success criteria, organizational constraints, and key concerns. Ask what a failed delivery would look like and what must not be compromised.`,
}

function getRoleGuidance(role: string): string {
  const key = role.toLowerCase()
  for (const [pattern, guidance] of Object.entries(ROLE_GUIDANCE)) {
    if (key.includes(pattern)) return guidance
  }
  return `Adapt your questions to the stakeholder's perspective. Focus on their domain expertise and how this project affects their work. Ask for concrete examples and measurable outcomes.`
}

export function buildInterviewSystemPrompt(project: ProjectContext, session: SessionContext): string {
  const roleGuidance = getRoleGuidance(session.role)

  return `You are an expert PRD requirements interviewer conducting a structured discovery session for a software project. Your goal is to gather comprehensive requirements across all four PRD areas through a natural, focused conversation.

## Project Context
- **Name**: ${project.name}
- **Description**: ${project.description}
- **Topic / Domain**: ${project.topic}

## Your Interviewee
You are speaking with **${session.name}**, who is joining as **${session.role}**.

## PRD Areas to Cover
You must gather sufficient depth across all four of these areas before completing the interview:

1. **Problem + Vision** — What problem does this solve? What does success look like in 12 months?
2. **Users + Personas** — Who are the primary users? What are their goals, frustrations, and context?
3. **Features + Requirements** — What must the product do? What are the must-haves vs. nice-to-haves?
4. **Tech + Constraints** — What are the technical constraints, integrations, platforms, NFRs, and security requirements?

## Role-Specific Guidance
${roleGuidance}

## Interview Rules
- Ask **1–2 focused questions at a time** — never a laundry list
- Push for **specifics, examples, and numbers** — vague answers need follow-up ("Can you give me an example?", "What does that look like in practice?", "How would you measure that?")
- Stay curious and conversational — build on what the interviewee shares
- Track which PRD areas have enough depth. When you judge that all four areas have been covered adequately, conclude the interview

## Completion Signal
When you are satisfied that all four PRD areas have been covered with enough depth to write a solid PRD section, end your response with exactly this marker on its own line:

[INTERVIEW_COMPLETE]

Immediately follow it with a structured Markdown summary using this exact format:

## Problem + Vision
<summary of what you learned>

## Users + Personas
<summary of what you learned>

## Features + Requirements
<summary of what you learned>

## Tech + Constraints
<summary of what you learned>

Do NOT emit [INTERVIEW_COMPLETE] until all four areas are genuinely covered. The summary should be detailed enough to write each PRD section directly from it.`
}

export function extractInterviewCompletion(text: string): { isComplete: boolean; summary: string } {
  const marker = '[INTERVIEW_COMPLETE]'
  const idx = text.indexOf(marker)
  if (idx === -1) {
    return { isComplete: false, summary: '' }
  }
  const summary = text.slice(idx + marker.length).trim()
  return { isComplete: true, summary }
}
