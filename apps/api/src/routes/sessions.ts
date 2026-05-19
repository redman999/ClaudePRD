import { Router, Request, Response } from 'express'
import { CreateSessionSchema, SendMessageSchema, Message } from '@claudeprd/contracts'
import prisma from '../lib/prisma'
import { buildInterviewSystemPrompt } from '../services/interview'
import { callLlm } from '../services/llm'
import { extractInterviewCompletion } from '../services/interview'
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

  const { shareToken, name, role } = result.data

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
        status: 'active',
        messages: '[]',
      },
    })

    return res.status(201).json({
      id: session.id,
      projectId: session.projectId,
      name: session.name,
      role: session.role,
      status: session.status,
      messages: [],
      createdAt: session.createdAt,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create session' })
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
      },
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch session' })
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

    const exchangeScores = await scoreExchange(latestUserMessage, cleanAssistantText)
    const prevCoverage = normalizeCoverage(session.coveredAreas)
    const newCoverage = mergeCoverage(prevCoverage, exchangeScores)

    const tooEarly = isComplete && userMessageCount < 5
    const coverageFallback = userMessageCount >= 8
    const coverageInsufficient =
      isComplete && !coverageFallback && !isCoverageSufficient(newCoverage)
    const stripMarker = tooEarly || coverageInsufficient
    const assistantText = stripMarker ? cleanAssistantText : rawText

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
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to process message' })
  }
})

export default router
