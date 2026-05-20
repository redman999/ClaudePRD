import { Router, Request, Response } from 'express'
import { CreateSessionSchema, SendMessageSchema, Message } from '@claudeprd/contracts'
import prisma from '../lib/prisma'
import {
  buildInterviewSystemPrompt,
  extractInterviewCompletion,
  extractQuickReplies,
} from '../services/interview'
import { callLlm } from '../services/llm'
import { synthesizePrd } from '../services/prd-writer'
import {
  scoreExchange,
  mergeCoverage,
  isCoverageSufficient,
  uncoveredAreas,
  normalizeCoverage,
} from '../services/coverage'

const router = Router()

// POST /api/sessions
router.post('/', async (req: Request, res: Response) => {
  const result = CreateSessionSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', issues: result.error.issues })
  }

  const { shareToken, name, role, mode } = result.data

  try {
    const project = await prisma.project.findUnique({ where: { shareToken } })
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const session = await prisma.session.create({
      data: {
        projectId: project.id,
        name,
        role,
        mode: mode ?? 'standard',
        status: 'active',
        messages: '[]',
      },
    })

    return res.status(201).json({
      id: session.id,
      projectId: session.projectId,
      name: session.name,
      role: session.role,
      mode: session.mode,
      status: session.status,
      messages: [],
      createdAt: session.createdAt,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create session' })
  }
})

// GET /api/sessions/lookup?shareToken=X&name=Y&role=Z
// Used by the join page to detect "you already have an active session" — must
// come before /:id so the param doesn't swallow it.
router.get('/lookup', async (req: Request, res: Response) => {
  const shareToken = typeof req.query.shareToken === 'string' ? req.query.shareToken : ''
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : ''
  const role = typeof req.query.role === 'string' ? req.query.role.trim() : ''
  if (!shareToken || !name || !role) {
    return res.status(400).json({ error: 'shareToken, name, role are all required' })
  }
  try {
    const project = await prisma.project.findUnique({ where: { shareToken } })
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    const active = await prisma.session.findFirst({
      where: {
        projectId: project.id,
        name: { equals: name, mode: 'insensitive' },
        role: { equals: role, mode: 'insensitive' },
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, role: true, status: true, createdAt: true },
    })
    if (!active) {
      return res.status(404).json({ error: 'No active session for this name+role' })
    }
    return res.json(active)
  } catch (err) {
    return res.status(500).json({ error: 'Lookup failed' })
  }
})

// GET /api/sessions/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    })
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const coverage = normalizeCoverage(session.coveredAreas)
    return res.json({
      ...session,
      messages: JSON.parse(session.messages) as unknown[],
      coverage,
      uncoveredAreas: uncoveredAreas(coverage),
      project: {
        name: session.project.name,
        description: session.project.description,
        shareToken: session.project.shareToken,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch session' })
  }
})

// DELETE /api/sessions/:id — discard a partial/incorrect interview. Only
// active sessions can be deleted; completed ones have already fed the PRD
// version history and removing them would create inconsistency.
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } })
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    if (session.status === 'complete') {
      return res.status(409).json({
        error: 'Completed sessions cannot be deleted — they are part of the PRD history',
      })
    }
    await prisma.session.delete({ where: { id: session.id } })
    return res.status(204).end()
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete session' })
  }
})

// POST /api/sessions/:id/messages
router.post('/:id/messages', async (req: Request, res: Response) => {
  const result = SendMessageSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', issues: result.error.issues })
  }

  const { content } = result.data

  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    if (session.status === 'complete') {
      return res.status(400).json({ error: 'Session is already complete' })
    }

    const messages: Message[] = JSON.parse(session.messages)
    const systemPrompt = buildInterviewSystemPrompt(session.project, session)

    if (content === '__START__') {
      messages.push({ role: 'user', content: 'Hi, I\'m ready to begin.' })
    } else {
      messages.push({ role: 'user', content })
    }

    const rawText = await callLlm(systemPrompt, messages)
    const userMessageCount = messages.filter(m => m.role === 'user').length
    const { isComplete, summary } = extractInterviewCompletion(rawText)

    const latestUserMessage = messages[messages.length - 1]?.content ?? ''
    const cleanAssistantText = isComplete
      ? rawText.slice(0, rawText.indexOf('[INTERVIEW_COMPLETE]')).trim()
      : rawText

    // In guided mode, pull QUICK_REPLIES out of the body and send them as
    // a separate field so the frontend can render buttons.
    const { cleanText: bodyForUser, quickReplies } =
      session.mode === 'guided'
        ? extractQuickReplies(cleanAssistantText)
        : { cleanText: cleanAssistantText, quickReplies: [] as string[] }

    const exchangeScores = await scoreExchange(latestUserMessage, bodyForUser)
    const prevCoverage = normalizeCoverage(session.coveredAreas)
    const newCoverage = mergeCoverage(prevCoverage, exchangeScores)

    const tooEarly = isComplete && userMessageCount < 5
    const coverageFallback = userMessageCount >= 8
    const coverageInsufficient =
      isComplete && !coverageFallback && !isCoverageSufficient(newCoverage)
    const stripMarker = tooEarly || coverageInsufficient
    // The text we store in the transcript is the user-facing body (no marker,
    // no QUICK_REPLIES block), with the marker re-appended at session end.
    const assistantText = stripMarker
      ? bodyForUser
      : isComplete
        ? bodyForUser
        : bodyForUser

    messages.push({ role: 'assistant', content: assistantText })

    if (isComplete && !tooEarly && !coverageInsufficient) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          messages: JSON.stringify(messages),
          status: 'complete',
          summary,
          coveredAreas: newCoverage as object,
          completedAt: new Date(),
        },
      })
      synthesizePrd(session.projectId, session.id).catch(console.error)
      return res.json({
        message: { role: 'assistant', content: assistantText },
        sessionStatus: 'complete',
        coverage: newCoverage,
        quickReplies,
      })
    }

    await prisma.session.update({
      where: { id: session.id },
      data: {
        messages: JSON.stringify(messages),
        coveredAreas: newCoverage as object,
      },
    })

    return res.json({
      message: { role: 'assistant', content: assistantText },
      sessionStatus: 'active',
      coverage: newCoverage,
      uncoveredAreas: uncoveredAreas(newCoverage),
      quickReplies,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to process message' })
  }
})

export default router
