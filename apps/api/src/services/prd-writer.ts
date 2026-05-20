import prisma from '../lib/prisma'
import { callLlm } from './llm'
import { PRD_TEMPLATES, type PrdTemplate, resolveTemplate } from './prd-templates'
import { decideSynthesisAction } from './saturation'

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

function buildSynthesisSystem(template: PrdTemplate): string {
  const sectionList = template.sections
    .map((s, i) => `${i + 1}. **${s.title}** — ${s.guidance}`)
    .join('\n')

  const sectionTitles = template.sections.map((s) => s.title).join(', ')

  return `You are a senior product manager writing a Product Requirements Document (PRD) by synthesising one or more stakeholder interview summaries.

**Language: Respond exclusively in English. Never use any other language, even for a single word — no Chinese characters, no transliterations, no mixed-language sentences.**

## PRD template: "${template.name}"

The PRD body must cover exactly these sections, in order:
${sectionList}

After those sections, append a final mandatory section titled **Open Questions & Trade-offs** that explicitly lists:
- Conflicts where stakeholders disagreed (e.g. "Eng says X is impossible in 6 weeks; Business needs it in 6 weeks")
- Decisions deferred or unowned
- Assumptions that need validation

If there are no conflicts, write "No unresolved trade-offs surfaced yet." in that section — never omit the header.

## Attribution rules (CRITICAL — this is what makes this PRD different from a generic AI summary)

For every non-trivial claim in the body, append inline attribution in square brackets using the stakeholder's display name and role: \`[Alice/PM]\`, \`[Bob/Engineer, Carol/Designer]\`.

- Use attribution on requirements, constraints, success metrics, persona descriptions, and prioritization calls
- Skip attribution for purely structural prose ("This document covers four areas...")
- When multiple stakeholders agree, list all of them in the same bracket
- When stakeholders disagree, note the disagreement inline: "Mobile is must-have [Alice/PM, Bob/Designer]; deferred to phase 2 [Carlos/Eng]"
- Do not invent quotes. Attribute the substance, not verbatim words.

## Output format

You MUST respond with ONLY a valid JSON object — no prose, no explanation, no markdown fences outside the JSON:

{
  "markdown": "<full PRD as a Markdown string with ## section headers for: ${sectionTitles}, Open Questions & Trade-offs>",
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

The ralphPrd must contain 3-5 phases representing implementation phases for a developer build loop. Each phase has 2-5 stories. Each story has 2-4 testable acceptance criteria. Acceptance criteria should be specific and verifiable (e.g. "User can submit form with empty email and sees inline error" — not "Form validates input").`
}

export async function synthesizePrd(
  projectId: string,
  triggeringSessionId?: string
): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sessions: {
          where: { status: 'complete' },
          select: { id: true, name: true, role: true, summary: true },
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

    const template = resolveTemplate(project.template)
    const latestVersion = await prisma.prdVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
      select: { version: true, markdown: true, ralphJson: true },
    })

    const saturationDecision = await decideSynthesisAction({
      project,
      sessions: project.sessions,
      triggeringSessionId,
      latestVersion,
    })

    if (saturationDecision.action === 'skip') {
      await prisma.prdVersion.create({
        data: {
          projectId,
          version: (latestVersion?.version ?? 0) + 1,
          markdown: latestVersion?.markdown ?? '',
          ralphJson: latestVersion?.ralphJson ?? '[]',
          triggeringSessionId: triggeringSessionId ?? null,
          synthesisSkipped: true,
          skipReason: saturationDecision.reason,
        },
      })
      console.log(`synthesizePrd: saturation skip for project ${projectId} — ${saturationDecision.reason}`)
      return
    }

    const currentPrd = latestVersion?.markdown ?? project.prdMarkdown ?? 'No PRD yet'
    const summaries = project.sessions
      .map((s) => `### ${s.name} (${s.role})\n${s.summary}`)
      .join('\n\n')

    const userMessage = `Project: ${project.name}
Description: ${project.description}
Topic: ${project.topic}
PRD template: ${project.template}

Current PRD:
${currentPrd}

Session Summaries (${project.sessions.length} stakeholder${project.sessions.length === 1 ? '' : 's'}):
${summaries}

Produce an updated PRD using the "${project.template}" template. Attribute every non-trivial claim. Surface conflicts in the "Open Questions & Trade-offs" section.`

    const rawResponse = await callLlm(buildSynthesisSystem(template), [
      { role: 'user', content: userMessage },
    ])

    const jsonStr = stripCodeFences(rawResponse)
    const parsed = JSON.parse(jsonStr) as SynthesisResult

    const nextVersion = (latestVersion?.version ?? 0) + 1
    const ralphJson = JSON.stringify(parsed.ralphPrd)

    await prisma.$transaction([
      prisma.prdVersion.create({
        data: {
          projectId,
          version: nextVersion,
          markdown: parsed.markdown,
          ralphJson,
          triggeringSessionId: triggeringSessionId ?? null,
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          prdMarkdown: parsed.markdown,
          prdRalphJson: ralphJson,
        },
      }),
    ])

    console.log(`synthesizePrd: project ${projectId} → v${nextVersion}`)
  } catch (err) {
    console.error(`synthesizePrd: failed for project ${projectId}`, err)
  }
}

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  return text.trim()
}

export { PRD_TEMPLATES }
