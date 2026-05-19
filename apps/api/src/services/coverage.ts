import { callLlm } from './llm'

export interface CoverageScores {
  problemVision: number
  usersPersonas: number
  featuresReqs: number
  techConstraints: number
}

export const EMPTY_COVERAGE: CoverageScores = {
  problemVision: 0,
  usersPersonas: 0,
  featuresReqs: 0,
  techConstraints: 0,
}

export const MIN_COVERAGE_DEPTH = 2

const AREAS: (keyof CoverageScores)[] = [
  'problemVision',
  'usersPersonas',
  'featuresReqs',
  'techConstraints',
]

const SCORER_SYSTEM = `You are a rubric scorer for a PRD discovery interview. You will receive the latest user message and the assistant's response. Score how much **new substantive information** was contributed to each of the four PRD areas in **this exchange only**, using this rubric:

- **0** — Not addressed in this exchange
- **1** — Mentioned but vague (no concrete detail)
- **2** — Addressed with a concrete example or specific claim
- **3** — Addressed in depth: a specific story, a measurable number, or a clear constraint

The four areas:
- **problemVision** — the problem, why it matters, what success looks like
- **usersPersonas** — who uses it, their goals, pain points, context
- **featuresReqs** — what the product must do, must-haves vs nice-to-haves
- **techConstraints** — technical constraints, NFRs, integrations, security

Respond with ONLY a JSON object — no prose, no markdown fences:
{"problemVision": <0-3>, "usersPersonas": <0-3>, "featuresReqs": <0-3>, "techConstraints": <0-3>}

Score only this single exchange. Cumulative coverage is tracked externally.`

export async function scoreExchange(
  userMessage: string,
  assistantMessage: string
): Promise<CoverageScores> {
  const payload = `User said:\n${userMessage}\n\nAssistant said:\n${assistantMessage}`
  try {
    const raw = await callLlm(SCORER_SYSTEM, [{ role: 'user', content: payload }])
    const parsed = parseScores(raw)
    if (!parsed) {
      console.warn('coverage.scoreExchange: failed to parse scorer output, returning zeros')
      return { ...EMPTY_COVERAGE }
    }
    return parsed
  } catch (err) {
    console.warn('coverage.scoreExchange: scorer call failed, returning zeros', err)
    return { ...EMPTY_COVERAGE }
  }
}

function parseScores(text: string): CoverageScores | null {
  const stripped = text.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim()
  const firstBrace = stripped.indexOf('{')
  const lastBrace = stripped.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) return null
  const slice = stripped.slice(firstBrace, lastBrace + 1)
  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(slice)
  } catch {
    return null
  }
  const result: CoverageScores = { ...EMPTY_COVERAGE }
  for (const area of AREAS) {
    const v = obj[area]
    if (typeof v === 'number' && v >= 0 && v <= 3) {
      result[area] = Math.round(v)
    }
  }
  return result
}

export function mergeCoverage(prev: CoverageScores, latest: CoverageScores): CoverageScores {
  return {
    problemVision: Math.max(prev.problemVision, latest.problemVision),
    usersPersonas: Math.max(prev.usersPersonas, latest.usersPersonas),
    featuresReqs: Math.max(prev.featuresReqs, latest.featuresReqs),
    techConstraints: Math.max(prev.techConstraints, latest.techConstraints),
  }
}

export function isCoverageSufficient(scores: CoverageScores): boolean {
  return AREAS.every((a) => scores[a] >= MIN_COVERAGE_DEPTH)
}

export function uncoveredAreas(scores: CoverageScores): (keyof CoverageScores)[] {
  return AREAS.filter((a) => scores[a] < MIN_COVERAGE_DEPTH)
}

export function normalizeCoverage(raw: unknown): CoverageScores {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_COVERAGE }
  const obj = raw as Record<string, unknown>
  const result: CoverageScores = { ...EMPTY_COVERAGE }
  for (const area of AREAS) {
    const v = obj[area]
    if (typeof v === 'number' && v >= 0 && v <= 3) {
      result[area] = Math.round(v)
    }
  }
  return result
}
