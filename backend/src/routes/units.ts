import { Router, Response } from 'express'
import prisma from '../models/db.js'
import { authMiddleware, AuthRequest } from '../services/auth.js'

const router = Router()

// Search unit by barcode
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { barcode } = req.query

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' })
    }

    const unit = await prisma.productionUnit.findUnique({
      where: { barcode: barcode as string },
      include: {
        order: {
          include: {
            product: {
              include: {
                routes: {
                  include: { workstation: true },
                  orderBy: { stepOrder: 'asc' }
                }
              }
            }
          }
        },
        scanEvents: {
          include: {
            workstation: true,
            scannedBy: { select: { id: true, fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' })
    }

    res.json(unit)
  } catch (error) {
    console.error('Search unit error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Get unit by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const unit = await prisma.productionUnit.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            product: {
              include: {
                routes: {
                  include: { workstation: true },
                  orderBy: { stepOrder: 'asc' }
                }
              }
            }
          }
        },
        scanEvents: {
          include: {
            workstation: true,
            scannedBy: { select: { id: true, fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' })
    }

    res.json(unit)
  } catch (error) {
    console.error('Get unit error:', error)
    res.status(500).json({ error: 'Failed to fetch unit' })
  }
})

export default router
