import { Router, Response } from 'express'
import prisma from '../models/db.js'
import { authMiddleware, AuthRequest } from '../services/auth.js'

const router = Router()

// Common rejection reasons
const REJECTION_REASONS = [
  'Malzeme hatasi',
  'Montaj hatasi',
  'Boyama hatasi',
  'Kalite kontrol basarisiz',
  'Olcu toleransi disinda',
  'Diger'
]

// Get all scans (list)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, workstationId } = req.query

    const where = workstationId ? { workstationId: workstationId as string } : {}

    const scans = await prisma.scanEvent.findMany({
      where,
      include: {
        unit: {
          include: {
            order: {
              select: { id: true, orderNo: true, product: { select: { code: true, name: true } } }
            }
          }
        },
        workstation: true,
        scannedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    })

    res.json(scans)
  } catch (error) {
    console.error('Get scans error:', error)
    res.status(500).json({ error: 'Failed to fetch scans' })
  }
})

// Scan barcode at workstation
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { barcode, workstationId, deviceId, result: forcedResult, reason } = req.body

    if (!barcode || !workstationId) {
      return res.status(400).json({ error: 'Barcode and workstation ID are required' })
    }

    // Find unit by barcode
    const unit = await prisma.productionUnit.findUnique({
      where: { barcode },
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
        }
      }
    })

    if (!unit) {
      return res.status(404).json({
        success: false,
        result: 'not_found',
        message: 'Birim bulunamadı'
      })
    }

    const product = unit.order.product
    const routes = product.routes
    const expectedStep = unit.currentStep

    // Handle rejection (quality control)
    if (forcedResult === 'rejected') {
      if (!reason) {
        return res.status(400).json({ error: 'Red nedeni gerekli' })
      }

      // Create scan event
      await prisma.scanEvent.create({
        data: {
          unitId: unit.id,
          workstationId,
          scannedById: req.userId,
          result: 'rejected',
          deviceId,
          notes: reason,
        }
      })

      // Update unit status
      await prisma.productionUnit.update({
        where: { id: unit.id },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: reason,
        }
      })

      return res.json({
        success: false,
        result: 'rejected',
        message: 'Birim reddedildi: ' + reason,
        unit: {
          id: unit.id,
          barcode: unit.barcode,
          currentStep: unit.currentStep,
          status: 'rejected',
        }
      })
    }

    // Check if order is active
    if (unit.order.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        result: 'rejected',
        message: 'Emir aktif değil'
      })
    }

    // Check if all routes completed
    if (expectedStep >= routes.length) {
      return res.status(400).json({
        success: false,
        result: 'duplicate',
        message: 'Birim zaten tamamlanmış (adım ' + (expectedStep) + '/' + routes.length + ')'
      })
    }

    const expectedRoute = routes[expectedStep]

    // Check if already scanned at this step
    const existingScan = await prisma.scanEvent.findFirst({
      where: {
        unitId: unit.id,
        workstationId: expectedRoute.workstationId,
        result: 'accepted'
      }
    })

    if (existingScan) {
      return res.status(400).json({
        success: false,
        result: 'duplicate',
        message: 'Bu adımda zaten tarama yapılmış'
      })
    }

    // Check if correct workstation
    let result = 'accepted'
    let message = 'Tarama kabul edildi'
    let matchedRoute = expectedRoute
    const workstation = await prisma.workstation.findUnique({ where: { id: workstationId } })

    if (expectedRoute.workstationId !== workstationId) {
      result = 'wrong_station'
      message = 'Yanlış istasyon. Beklenen: ' + expectedRoute.workstation.name + ', Girilen: ' + workstation.name
    }

    // Create scan event
    const scanEvent = await prisma.scanEvent.create({
      data: {
        unitId: unit.id,
        workstationId,
        scannedById: req.userId,
        result,
        deviceId,
        isRootScan: unit.currentStep === 0
      }
    })

    // Update unit if accepted
    if (result === 'accepted') {
      const isFinalStep = expectedRoute.isFinalStep
      const isLastStep = expectedStep === routes.length - 1

      await prisma.productionUnit.update({
        where: { id: unit.id },
        data: {
          currentStep: isLastStep ? expectedStep + 1 : expectedStep + 1,
          currentWorkstationId: workstationId,
          status: isFinalStep ? 'completed' : 'in_progress',
          completedAt: isFinalStep ? new Date() : null
        }
      })

      // Check if order should be completed
      if (isFinalStep && product.level === 1) {
        const remainingUnits = await prisma.productionUnit.count({
          where: {
            orderId: unit.orderId,
            status: { not: 'completed' }
 }
        })

        if (remainingUnits === 0) {
          await prisma.productionOrder.update({
            where: { id: unit.orderId },
            data: {
              status: 'completed',
              completedAt: new Date()
            }
          })
        }
      }

      message = 'Tarama kabul edildi. Adım ' + (expectedStep + 1) + '/' + routes.length
    }

    // Get next step info
    let nextStep = null
    let nextWorkstation = null

    if (result === 'accepted' && expectedStep + 1 < routes.length) {
      nextStep = expectedStep + 1
      nextWorkstation = routes[nextStep].workstation
    }

    res.json({
      success: result === 'accepted',
      result,
      message,
      unit: {
        id: unit.id,
        barcode: unit.barcode,
        currentStep: result === 'accepted' ? unit.currentStep + 1 : unit.currentStep,
        status: result === 'accepted' ? (expectedRoute.isFinalStep ? 'completed' : 'in_progress') : unit.status
      },
      nextStep,
      nextWorkstation: nextWorkstation ? {
        id: nextWorkstation.id,
        code: nextWorkstation.code,
        name: nextWorkstation.name
      } : null
    })
  } catch (error) {
    console.error('Scan error:', error)
    res.status(500).json({ error: 'Scan failed' })
  }
})

// Get rejection reasons
router.get('/rejection-reasons', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json(REJECTION_REASONS)
})

// Get scan events by barcode
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
          include: { workstation: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' })
    }

    res.json(unit)
  } catch (error) {
    console.error('Search scan error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Get scan history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, workstationId } = req.query

    const scans = await prisma.scanEvent.findMany({
      where: workstationId ? { workstationId: workstationId as string } : undefined,
      include: {
        unit: {
          include: {
            order: {
              select: { id: true, orderNo: true, product: { select: { code: true, name: true } } }
            }
          }
        },
        workstation: true,
        scannedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    })

    res.json(scans)
  } catch (error) {
    console.error('Get scan history error:', error)
    res.status(500).json({ error: 'Failed to fetch scan history' })
  }
})

export default router
