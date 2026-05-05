import { Router, Request, Response } from 'express'
import { CreateProjectSchema } from '@claudeprd/contracts'
import prisma from '../lib/prisma'

const router = Router()

// POST /api/projects
router.post('/', async (req: Request, res: Response) => {
  const result = CreateProjectSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', issues: result.error.issues })
  }

  const { name, description, topic } = result.data

  try {
    const project = await prisma.project.create({
      data: { name, description, topic },
    })
    return res.status(201).json(project)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create project' })
  }
})

// GET /api/projects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sessions: true } },
      },
    })
    return res.json(projects)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { sessions: true },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    return res.json({
      ...project,
      sessions: project.sessions.map(s => ({
        ...s,
        messages: JSON.parse(s.messages) as unknown[],
      })),
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch project' })
  }
})

export default router
