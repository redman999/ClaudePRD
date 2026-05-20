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

  return `You are a senior product manager writing a Product Requirements Document (PRD) by synthesising one or more stakeholder interview transcripts.

**Language: Respond exclusively in English. Never use any other language, even for a single word — no Chinese characters, no transliterations, no mixed-language sentences.**

## PRD template: "${template.name}"

The PRD body must cover exactly these sections, in order:
${sectionList}

After those sections, append a final mandatory section titled **Open Questions & Trade-offs** that explicitly lists:
- Conflicts where stakeholders disagreed (e.g. "Eng says X is impossible in 6 weeks; Business needs it in 6 weeks")
- Decisions deferred or unowned
- Assumptions that need validation

If there are no conflicts, write "No unresolved trade-offs surfaced yet." in that section — never omit the header.

## Faithfulness rules (CRITICAL — this is what makes the PRD useful)

You are working from real transcripts. Treat the stakeholders' actual words as ground truth. Do NOT generalise or smooth:

- **Copy named systems verbatim.** If a stakeholder said "Manhattan WMS", write "Manhattan WMS" — not "the WMS", not "their warehouse system".
- **Copy numbers verbatim.** "p95 under 300ms at 50 concurrent" must appear as "p95 under 300ms at 50 concurrent" — not "low latency", not "fast response".
- **Copy product names, version numbers, vendor names, file formats, ports, percentages, deadlines, dollar amounts, head-counts.** All of these must appear in the PRD with the exact value the stakeholder gave.
- **Copy specific incidents.** If a stakeholder described "Maria lost 18 minutes last Tuesday on one SKU because the secondary location was 3 aisles away", that example belongs in the PRD's Users section, with the specifics intact.
- **Do not invent.** If the transcripts don't cover something, leave it out. Do not fill in best-guess roles, integrations, deadlines, or personas that were never mentioned.
- **Do not paraphrase.** A short verbatim quote is better than a polished summary.

## Attribution rules

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
          select: { id: true, name: true, role: true, summary: true, messages: true },
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
    const transcripts = project.sessions
      .map((s) => renderTranscript(s))
      .join('\n\n---\n\n')

    const userMessage = `Project: ${project.name}
Description: ${project.description}
Topic: ${project.topic}
PRD template: ${project.template}

Current PRD:
${currentPrd}

Stakeholder interview transcripts (${project.sessions.length} stakeholder${project.sessions.length === 1 ? '' : 's'}):
${transcripts}

Produce an updated PRD using the "${project.template}" template, grounded in what the stakeholders actually said in the transcripts above. Apply the faithfulness rules — copy named systems, numbers, and specific incidents verbatim. Attribute every non-trivial claim with [Name/Role]. Surface real conflicts in the "Open Questions & Trade-offs" section; do not invent conflicts that aren't in the transcripts.`

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

interface SessionLike {
  name: string
  role: string
  summary: string
  messages: string
}

// Render a session's full transcript for the synthesiser. We use the actual
// Q&A so the model can ground every PRD claim in something a stakeholder
// said, rather than working from a lossy end-of-interview summary.
//
// Strips the auto-generated "Hi, I'm ready to begin." opener and drops the
// [INTERVIEW_COMPLETE] tail block so the model isn't tempted to copy the
// summary template back as content.
function renderTranscript(session: SessionLike): string {
  let messages: Array<{ role: string; content: string }> = []
  try {
    const parsed = JSON.parse(session.messages)
    if (Array.isArray(parsed)) messages = parsed
  } catch {
    // Fall back to summary if messages JSON is corrupt
    return `### ${session.name} (${session.role})\n${session.summary}`
  }

  const lines: string[] = [`### ${session.name} (${session.role})`]
  for (const m of messages) {
    const content = (m.content ?? '').trim()
    if (!content) continue
    if (m.role === 'user' && content === "Hi, I'm ready to begin.") continue
    let body = content
    // Drop everything from [INTERVIEW_COMPLETE] onward — that block is the
    // assistant's summary template, not interview content.
    const completeIdx = body.indexOf('[INTERVIEW_COMPLETE]')
    if (completeIdx !== -1) body = body.slice(0, completeIdx).trim()
    if (!body) continue
    const speaker = m.role === 'user' ? session.name : 'Interviewer'
    lines.push(`**${speaker}:** ${body}`)
  }
  return lines.join('\n\n')
}

export { PRD_TEMPLATES }
