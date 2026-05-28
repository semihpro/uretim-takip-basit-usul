import { Router, Response } from 'express'
import prisma from '../models/db.js'
import { authMiddleware, AuthRequest } from '../services/auth.js'

const router = Router()

// Get dashboard stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Count orders by status
    const orderStats = await prisma.productionOrder.groupBy({
      by: ['status'],
      _count: true
    })

    const orderCounts = orderStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count
      return acc
    }, {} as Record<string, number>)

    // Today's scans
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayScans = await prisma.scanEvent.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    })

    // Active unit count
    const activeUnits = await prisma.productionUnit.count({
      where: {
        status: { in: ['pending', 'in_progress'] }
      }
    })

    // Completed today
    const completedToday = await prisma.productionUnit.count({
      where: {
        status: 'completed',
        completedAt: {
          gte: today
        }
      }
    })

    // Get scan counts per workstation today
    const workstationScansGrouped = await prisma.scanEvent.groupBy({
      by: ['workstationId'],
      where: {
        createdAt: { gte: today }
      },
      _count: true
    })

    // Create a map of workstationId -> scan count
    const scanCountMap: Record<string, number> = {}
    workstationScansGrouped.forEach(ws => {
      scanCountMap[ws.workstationId] = ws._count
    })

    // Get all workstations and return with their scan counts (0 if no scans)
    const allWorkstations = await prisma.workstation.findMany({
      where: { isActive: true }
    })

    const workstationStats = allWorkstations.map(ws => ({
      id: ws.id,
      code: ws.code,
      name: ws.name,
      scanCount: scanCountMap[ws.id] || 0
    }))

    // Daily scans for last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const dailyScansRaw = await prisma.scanEvent.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _count: true
    })

    // Group by date
    const dailyScansMap: Record<string, number> = {}
    dailyScansRaw.forEach(item => {
      const dateKey = item.createdAt.toISOString().split('T')[0]
      dailyScansMap[dateKey] = (dailyScansMap[dateKey] || 0) + item._count
    })

    // Fill in all 7 days
    const dailyScans = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dailyScans.push({
        date: dateKey,
        count: dailyScansMap[dateKey] || 0
      })
    }

    res.json({
      orders: {
        draft: orderCounts['draft'] || 0,
        in_progress: orderCounts['in_progress'] || 0,
        completed: orderCounts['completed'] || 0,
        cancelled: orderCounts['cancelled'] || 0,
        total: Object.values(orderCounts).reduce((a, b) => a + b, 0)
      },
      todayScans,
      activeUnits,
      completedToday,
      workstationStats,
      dailyScans
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

// Get recent orders
router.get('/recent-orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.productionOrder.findMany({
      include: {
        product: { select: { code: true, name: true } },
        _count: { select: { units: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    res.json(orders)
  } catch (error) {
    console.error('Recent orders error:', error)
    res.status(500).json({ error: 'Failed to fetch recent orders' })
  }
})

// Get recent scans
router.get('/recent-scans', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scans = await prisma.scanEvent.findMany({
      include: {
        unit: {
          include: {
            order: { select: { orderNo: true } }
          }
        },
        workstation: { select: { code: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    res.json(scans)
  } catch (error) {
    console.error('Recent scans error:', error)
    res.status(500).json({ error: 'Failed to fetch recent scans' })
  }
})

// Get order by status
router.get('/orders/by-status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const byStatus = await prisma.productionOrder.groupBy({
      by: ['status'],
      _count: true
    })

    res.json(byStatus.map(s => ({
      status: s.status,
      count: s._count
    })))
  } catch (error) {
    console.error('Orders by status error:', error)
    res.status(500).json({ error: 'Failed to fetch orders by status' })
  }
})

export default router
