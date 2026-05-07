import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

// GET /api/projects/:id/export/markdown
router.get('/:id/export/markdown', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { name: true, prdMarkdown: true },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (!project.prdMarkdown) {
      return res.status(400).json({ error: 'PRD not yet generated' })
    }

    const safeName = project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    res.setHeader('Content-Disposition', `attachment; filename="prd-${safeName}.md"`)
    res.setHeader('Content-Type', 'text/markdown')
    return res.send(project.prdMarkdown)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export PRD' })
  }
})

// GET /api/projects/:id/export/ralph
router.get('/:id/export/ralph', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { prdRalphJson: true },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (!project.prdRalphJson || project.prdRalphJson === '[]') {
      return res.status(400).json({ error: 'PRD not yet generated' })
    }

    res.setHeader('Content-Disposition', 'attachment; filename="prd.json"')
    res.setHeader('Content-Type', 'application/json')
    return res.send(project.prdRalphJson)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export ralph JSON' })
  }
})

export default router
