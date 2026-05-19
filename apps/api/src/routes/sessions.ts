import { Router, Request, Response } from 'express'
import { CreateSessionSchema, SendMessageSchema, Message } from '@claudeprd/contracts'
import prisma from '../lib/prisma'
import { buildInterviewSystemPrompt } from '../services/interview'
import { callLlm } from '../services/llm'
import { extractInterviewCompletion } from '../services/interview'
import { synthesizePrd } from '../services/prd-writer'

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

    return res.json({
      ...session,
      messages: JSON.parse(session.messages) as unknown[],
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

    const tooEarly = isComplete && userMessageCount < 5
    const assistantText = tooEarly
      ? rawText.slice(0, rawText.indexOf('[INTERVIEW_COMPLETE]')).trim()
      : rawText

    messages.push({ role: 'assistant', content: assistantText })

    if (isComplete && !tooEarly) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          messages: JSON.stringify(messages),
          status: 'complete',
          summary,
          completedAt: new Date(),
        },
      })
      synthesizePrd(session.projectId).catch(console.error)
      return res.json({
        message: { role: 'assistant', content: assistantText },
        sessionStatus: 'complete',
      })
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { messages: JSON.stringify(messages) },
    })

    return res.json({
      message: { role: 'assistant', content: assistantText },
      sessionStatus: 'active',
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to process message' })
  }
})

export default router
