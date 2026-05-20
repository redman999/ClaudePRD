import { Router, Request, Response } from 'express'
import { CreateProjectSchema } from '@claudeprd/contracts'
import prisma from '../lib/prisma'
import { listTemplates } from '../services/prd-templates'
import { synthesizePrd } from '../services/prd-writer'

const router = Router()

// GET /api/projects/templates — must be before /:id
router.get('/templates', (_req: Request, res: Response) => {
  return res.json(listTemplates())
})

// POST /api/projects
router.post('/', async (req: Request, res: Response) => {
  const result = CreateProjectSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', issues: result.error.issues })
  }

  const { name, description, topic, template } = result.data

  try {
    const project = await prisma.project.create({
      data: { name, description, topic, template: template ?? 'standard' },
    })
    return res.status(201).json(project)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create project' })
  }
})

// POST /api/projects/:id/resynthesize — force a fresh PRD synthesis using
// the current synthesis prompt, without needing a new session. Useful after
// the synthesis prompt or template is improved and existing projects need
// their PRDs regenerated.
router.post('/:id/resynthesize', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { sessions: { where: { status: 'complete' }, select: { id: true } } },
    })
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    if (project.sessions.length === 0) {
      return res.status(409).json({ error: 'No completed sessions to synthesize from' })
    }
    // Fire-and-forget, same pattern as the post-session trigger
    synthesizePrd(project.id).catch((err) =>
      console.error('resynthesize: synthesizePrd failed', err)
    )
    return res.status(202).json({
      message: 'Resynthesis triggered',
      projectId: project.id,
      sessionsConsumed: project.sessions.length,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to trigger resynthesis' })
  }
})

// GET /api/projects/:id/versions
router.get('/:id/versions', async (req: Request, res: Response) => {
  try {
    const versions = await prisma.prdVersion.findMany({
      where: { projectId: req.params.id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        triggeringSessionId: true,
        synthesisSkipped: true,
        skipReason: true,
        createdAt: true,
      },
    })
    return res.json(versions)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch versions' })
  }
})

// GET /api/projects/:id/versions/:v
router.get('/:id/versions/:v', async (req: Request, res: Response) => {
  const v = parseInt(req.params.v, 10)
  if (!Number.isFinite(v)) {
    return res.status(400).json({ error: 'Invalid version number' })
  }
  try {
    const version = await prisma.prdVersion.findUnique({
      where: { projectId_version: { projectId: req.params.id, version: v } },
    })
    if (!version) {
      return res.status(404).json({ error: 'Version not found' })
    }
    return res.json({
      ...version,
      ralphPrd: JSON.parse(version.ralphJson) as unknown,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch version' })
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

// GET /api/projects/join/:shareToken — must be before /:id
router.get('/join/:shareToken', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { shareToken: req.params.shareToken },
      select: { id: true, name: true, description: true, topic: true },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    return res.json(project)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch project' })
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
