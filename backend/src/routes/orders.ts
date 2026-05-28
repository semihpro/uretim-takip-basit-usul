import { Router, Request, Response } from 'express'
import prisma from '../models/db.js'
import { authMiddleware, AuthRequest, requireRole } from '../services/auth.js'
import { nanoid } from 'nanoid'

const router = Router()

// Generate barcode for unit
function generateBarcode(orderNo: string, index: number): string {
  const paddedIndex = String(index).padStart(4, '0')
  return `${orderNo}-${paddedIndex}`
}

// Get all orders
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = 50 } = req.query

    const orders = await prisma.productionOrder.findMany({
      where: status ? { status: status as string } : undefined,
      include: {
        product: true,
        createdBy: {
          select: { id: true, fullName: true }
        },
        _count: {
          select: { units: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    })

    // Get unit stats for each order
    const ordersWithStats = await Promise.all(
      orders.map(async (order) => {
        const unitStats = await prisma.productionUnit.groupBy({
          by: ['status'],
          where: { orderId: order.id },
          _count: true
        })
        
        return {
          ...order,
          unitStats: unitStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count
            return acc
          }, {} as Record<string, number>)
        }
      })
    )

    res.json(ordersWithStats)
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Get single order with units and scan events
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: req.params.id },
      include: {
        product: {
          include: {
            routes: {
              include: { workstation: true },
              orderBy: { stepOrder: 'asc' }
            }
          }
        },
        createdBy: {
          select: { id: true, fullName: true }
        },
        units: {
          orderBy: { barcode: 'asc' },
          include: {
            scanEvents: {
              include: {
                workstation: true,
                scannedBy: { select: { id: true, fullName: true } }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// Create order (draft)
router.post('/', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const { orderNo, productId, quantity, dueDate, notes } = req.body

    if (!orderNo || !productId || !quantity) {
      return res.status(400).json({ error: 'Order number, product and quantity are required' })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Check if order number exists
    const existing = await prisma.productionOrder.findUnique({ where: { orderNo } })
    if (existing) {
      return res.status(400).json({ error: 'Order number already exists' })
    }

    const order = await prisma.productionOrder.create({
      data: {
        orderNo,
        productId,
        quantity,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        createdById: req.userId!,
        status: 'draft'
      },
      include: {
        product: true,
        createdBy: { select: { id: true, fullName: true } }
      }
    })

    res.status(201).json(order)
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// Confirm order → Create production units
router.post('/:id/confirm', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: req.params.id },
      include: { units: true }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft orders can be confirmed' })
    }

    // Create units if not already created
    if (order.units.length === 0) {
      const units = []
      for (let i = 1; i <= order.quantity; i++) {
        units.push({
          orderId: order.id,
          barcode: generateBarcode(order.orderNo, i),
          currentStep: 0,
          status: 'pending'
        })
      }
      
      await prisma.productionUnit.createMany({ data: units })
    }

    // Update order status
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: req.params.id },
      data: { status: 'in_progress' },
      include: {
        product: true,
        units: true,
        createdBy: { select: { id: true, fullName: true } }
      }
    })

    res.json(updatedOrder)
  } catch (error) {
    console.error('Confirm order error:', error)
    res.status(500).json({ error: 'Failed to confirm order' })
  }
})

// Update order
router.put('/:id', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const { orderNo, productId, quantity, dueDate, notes, status } = req.body

    const order = await prisma.productionOrder.update({
      where: { id: req.params.id },
      data: {
        orderNo,
        productId,
        quantity,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        status
      },
      include: {
        product: true,
        createdBy: { select: { id: true, fullName: true } }
      }
    })

    res.json(order)
  } catch (error) {
    console.error('Update order error:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

// Cancel order
router.post('/:id/cancel', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.productionOrder.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: { product: true }
    })

    res.json(order)
  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

// Get order progress
router.get('/:id/progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: req.params.id },
      include: {
        product: {
          include: {
            routes: {
              include: { workstation: true },
              orderBy: { stepOrder: 'asc' }
            }
          }
        },
        units: true
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Calculate progress
    const totalUnits = order.units.length
    const completedUnits = order.units.filter(u => u.status === 'completed').length
    const inProgressUnits = order.units.filter(u => u.status === 'in_progress').length
    const pendingUnits = order.units.filter(u => u.status === 'pending').length

    // Calculate step-wise progress from routes
    const routes = order.product.routes
    const stepProgress = routes.map((route, index) => {
      const scannedAtThisStep = order.units.filter(u => {
        return true // Simplified - in real app, check scan events
      }).length
      
      return {
        step: index + 1,
        workstation: route.workstation,
        isFinal: route.isFinalStep,
        completedUnits: 0, // TODO: Calculate from scan events
        totalUnits
      }
    })

    res.json({
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      totalUnits,
      completedUnits,
      inProgressUnits,
      pendingUnits,
      progress: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0,
      routes: stepProgress
    })
  } catch (error) {
    console.error('Get order progress error:', error)
    res.status(500).json({ error: 'Failed to get order progress' })
  }
})

export default router
