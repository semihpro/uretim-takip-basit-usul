import { Router, Request, Response } from 'express'
import prisma from '../models/db.js'
import { authMiddleware, AuthRequest, requireRole } from '../services/auth.js'

const router = Router()

// Get all workstations
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workstations = await prisma.workstation.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    })

    res.json(workstations)
  } catch (error) {
    console.error('Get workstations error:', error)
    res.status(500).json({ error: 'Failed to fetch workstations' })
  }
})

// Get single workstation
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workstation = await prisma.workstation.findUnique({
      where: { id: req.params.id },
      include: {
        routes: {
          include: { product: true },
          orderBy: { stepOrder: 'asc' }
        }
      }
    })

    if (!workstation) {
      return res.status(404).json({ error: 'Workstation not found' })
    }

    res.json(workstation)
  } catch (error) {
    console.error('Get workstation error:', error)
    res.status(500).json({ error: 'Failed to fetch workstation' })
  }
})

// Create workstation
router.post('/', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description } = req.body

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' })
    }

    const existing = await prisma.workstation.findUnique({ where: { code } })
    if (existing) {
      return res.status(400).json({ error: 'Workstation code already exists' })
    }

    const workstation = await prisma.workstation.create({
      data: { code, name, description }
    })

    res.status(201).json(workstation)
  } catch (error) {
    console.error('Create workstation error:', error)
    res.status(500).json({ error: 'Failed to create workstation' })
  }
})

// Update workstation
router.put('/:id', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description, isActive } = req.body

    const workstation = await prisma.workstation.update({
      where: { id: req.params.id },
      data: { code, name, description, isActive }
    })

    res.json(workstation)
  } catch (error) {
    console.error('Update workstation error:', error)
    res.status(500).json({ error: 'Failed to update workstation' })
  }
})

// Delete workstation
router.delete('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.workstation.update({
      where: { id: req.params.id },
      data: { isActive: false }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete workstation error:', error)
    res.status(500).json({ error: 'Failed to delete workstation' })
  }
})

// Seed default workstations
router.post('/seed-defaults', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const defaults = [
      { code: 'KESIM', name: 'Kesim' },
      { code: 'BUKUM', name: 'Büküm' },
      { code: 'KAYNAK', name: 'Kaynak' },
      { code: 'BOYAMA', name: 'Boyama' },
      { code: 'MONTAJ', name: 'Montaj' },
      { code: 'KALITE', name: 'Kalite Kontrol' },
      { code: 'PAKET', name: 'Paketleme' }
    ]

    const results = []
    for (const ws of defaults) {
      const existing = await prisma.workstation.findUnique({ where: { code: ws.code } })
      if (!existing) {
        const created = await prisma.workstation.create({ data: ws })
        results.push(created)
      }
    }

    res.json({ created: results.length, workstations: results })
  } catch (error) {
    console.error('Seed workstations error:', error)
    res.status(500).json({ error: 'Failed to seed workstations' })
  }
})

export default router
