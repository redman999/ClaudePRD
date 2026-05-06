import { Router, Request, Response } from 'express'
import { CreateSessionSchema } from '@claudeprd/contracts'
import prisma from '../lib/prisma'

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
    const session = await prisma.session.findUnique({ where: { id: req.params.id } })
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    return res.json({
      ...session,
      messages: JSON.parse(session.messages) as unknown[],
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch session' })
  }
})

export default router
