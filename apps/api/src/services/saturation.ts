import { callLlm } from './llm'

interface SessionSummary {
  id: string
  name: string
  role: string
  summary: string
}

interface ProjectLike {
  id: string
  name: string
  description: string
  topic: string
}

interface DecisionInput {
  project: ProjectLike
  sessions: SessionSummary[]
  triggeringSessionId?: string
  latestVersion: { version: number; markdown: string; ralphJson: string } | null
}

export interface SaturationDecision {
  action: 'synthesize' | 'skip'
  reason?: string
}

const SATURATION_SYSTEM = `You are evaluating whether a new stakeholder interview adds substantive new requirements to an existing PRD, or whether it merely corroborates what is already known.

You will receive:
- The current PRD markdown
- A new interview summary

Return ONLY a JSON object — no prose, no markdown fences:
{
  "newThemes": <integer count of distinct new requirements, constraints, personas, or risks introduced — not previously covered in the PRD>,
  "reason": "<one short sentence>"
}

Be strict. A rephrasing of an existing requirement is NOT a new theme. A genuinely new constraint, persona, conflict, success metric, or integration IS a new theme. Vague agreement with existing content scores 0.`

export async function decideSynthesisAction(input: DecisionInput): Promise<SaturationDecision> {
  // Always synthesize when:
  // - this is the first session
  // - there is no prior PRD version
  // - we don't know which session triggered this
  if (!input.latestVersion || !input.triggeringSessionId || input.sessions.length <= 1) {
    return { action: 'synthesize' }
  }

  const triggering = input.sessions.find((s) => s.id === input.triggeringSessionId)
  if (!triggering) {
    return { action: 'synthesize' }
  }

  try {
    const payload = `Existing PRD:
${input.latestVersion.markdown}

New interview summary from ${triggering.name} (${triggering.role}):
${triggering.summary}`

    const raw = await callLlm(SATURATION_SYSTEM, [{ role: 'user', content: payload }])
    const parsed = parseDecision(raw)
    if (!parsed) {
      return { action: 'synthesize' }
    }
    if (parsed.newThemes <= 0) {
      return {
        action: 'skip',
        reason: parsed.reason || 'Session corroborates existing PRD with no new themes',
      }
    }
    return { action: 'synthesize' }
  } catch (err) {
    console.warn('saturation.decideSynthesisAction: scorer failed, defaulting to synthesize', err)
    return { action: 'synthesize' }
  }
}

function parseDecision(text: string): { newThemes: number; reason: string } | null {
  const stripped = text.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim()
  const firstBrace = stripped.indexOf('{')
  const lastBrace = stripped.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) return null
  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(stripped.slice(firstBrace, lastBrace + 1))
  } catch {
    return null
  }
  const newThemes = typeof obj.newThemes === 'number' ? obj.newThemes : NaN
  if (!Number.isFinite(newThemes)) return null
  const reason = typeof obj.reason === 'string' ? obj.reason : ''
  return { newThemes, reason }
}
