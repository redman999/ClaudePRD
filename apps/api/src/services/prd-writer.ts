import prisma from '../lib/prisma'
import { callLlm } from './llm'

interface PrdStory {
  id: string
  title: string
  description: string
  status: 'todo'
  acceptance_criteria: string[]
}

interface PrdPhase {
  id: string
  name: string
  status: 'todo'
  stories: PrdStory[]
}

interface SynthesisResult {
  markdown: string
  ralphPrd: PrdPhase[]
}

const SYNTHESIS_SYSTEM = `You are a senior product manager writing a Product Requirements Document (PRD).

You will receive the current PRD state and summaries from stakeholder interviews. Incorporate all insights and produce a comprehensive, updated PRD.

The PRD must cover exactly four sections:
1. Problem & Vision — the problem being solved, why it matters, the product vision
2. Users & Personas — target users, their roles, pain points, and workflows
3. Features & Requirements — functional requirements, feature list, user stories
4. Tech & Constraints — technical requirements, NFRs, constraints, integrations

You MUST respond with ONLY a valid JSON object — no prose, no explanation, no markdown outside the JSON:
{
  "markdown": "<full PRD as a Markdown string with ## section headers>",
  "ralphPrd": [
    {
      "id": "P1",
      "name": "Phase 1 — <phase name>",
      "status": "todo",
      "stories": [
        {
          "id": "P1-S1",
          "title": "<story title>",
          "description": "<detailed description>",
          "status": "todo",
          "acceptance_criteria": ["<criterion 1>", "<criterion 2>"]
        }
      ]
    }
  ]
}

The ralphPrd must contain 3-5 phases representing implementation phases for a developer build loop.`

export async function synthesizePrd(projectId: string): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sessions: {
          where: { status: 'complete' },
          select: { name: true, role: true, summary: true },
        },
      },
    })

    if (!project) {
      console.error(`synthesizePrd: project ${projectId} not found`)
      return
    }

    if (project.sessions.length === 0) {
      console.log(`synthesizePrd: no complete sessions for project ${projectId}, skipping`)
      return
    }

    const currentPrd = project.prdMarkdown || 'No PRD yet'
    const summaries = project.sessions
      .map((s) => `### ${s.name} (${s.role})\n${s.summary}`)
      .join('\n\n')

    const userMessage = `Project: ${project.name}
Description: ${project.description}
Topic: ${project.topic}

Current PRD:
${currentPrd}

Session Summaries:
${summaries}

Please produce an updated PRD incorporating all session insights.`

    const rawResponse = await callLlm(SYNTHESIS_SYSTEM, [{ role: 'user', content: userMessage }])

    const jsonStr = stripCodeFences(rawResponse)
    const parsed = JSON.parse(jsonStr) as SynthesisResult

    await prisma.project.update({
      where: { id: projectId },
      data: {
        prdMarkdown: parsed.markdown,
        prdRalphJson: JSON.stringify(parsed.ralphPrd),
      },
    })

    console.log(`synthesizePrd: updated PRD for project ${projectId}`)
  } catch (err) {
    console.error(`synthesizePrd: failed for project ${projectId}`, err)
  }
}

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  return text.trim()
}
