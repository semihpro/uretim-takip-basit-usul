import { Router, Request, Response } from 'express'
import prisma from '../models/db.js'
import { authMiddleware, AuthRequest, requireRole } from '../services/auth.js'

const router = Router()

// Get all products (tree structure)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        children: {
          where: { deletedAt: null, isActive: true }
        },
        routes: {
          include: { workstation: true },
          orderBy: { stepOrder: 'asc' }
        }
      },
      orderBy: { code: 'asc' }
    })

    res.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// Get product tree (hierarchical)
router.get('/tree', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Get all root products (no parent)
    const rootProducts = await prisma.product.findMany({
      where: { parentId: null, deletedAt: null, isActive: true },
      include: {
        routes: {
          include: { workstation: true },
          orderBy: { stepOrder: 'asc' }
        },
        _count: {
          select: { children: true }
        }
      },
      orderBy: { code: 'asc' }
    })

    // Recursive function to build tree
    async function buildTree(product: any): Promise<any> {
      const children = await prisma.product.findMany({
        where: { parentId: product.id, deletedAt: null, isActive: true },
        include: {
          routes: {
            include: { workstation: true },
            orderBy: { stepOrder: 'asc' }
          },
          _count: {
            select: { children: true }
          }
        },
        orderBy: { code: 'asc' }
      })

      return {
        ...product,
        children: await Promise.all(children.map(buildTree))
      }
    }

    const tree = await Promise.all(rootProducts.map(buildTree))
    res.json(tree)
  } catch (error) {
    console.error('Get product tree error:', error)
    res.status(500).json({ error: 'Failed to fetch product tree' })
  }
})

// Get single product
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null, isActive: true }
        },
        routes: {
          include: { workstation: true },
          orderBy: { stepOrder: 'asc' }
        },
        productionOrders: {
          where: { status: { not: 'cancelled' } }
        }
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// Create product
router.post('/', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, unit, parentId, description } = req.body

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' })
    }

    // Calculate level
    let level = 1
    if (parentId) {
      const parent = await prisma.product.findUnique({ where: { id: parentId } })
      if (parent) {
        level = parent.level + 1
      }
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        unit,
        parentId,
        level,
        description
      }
    })

    res.status(201).json(product)
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// Update product
router.put('/:id', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, unit, parentId, description, isActive } = req.body

    // Calculate level if parent changed
    let level = undefined
    if (parentId !== undefined) {
      if (parentId === null) {
        level = 1
      } else {
        const parent = await prisma.product.findUnique({ where: { id: parentId } })
        level = parent ? parent.level + 1 : 1
      }
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        unit,
        parentId,
        level,
        description,
        isActive
      }
    })

    res.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// Delete product (soft delete)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isActive: false }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// Add route to product
router.post('/:id/routes', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const { workstationId, stepOrder, isFinalStep, expectedDuration, notes } = req.body

    if (!workstationId || !stepOrder) {
      return res.status(400).json({ error: 'Workstation ID and step order are required' })
    }

    const route = await prisma.productRoute.create({
      data: {
        productId: req.params.id,
        workstationId,
        stepOrder,
        isFinalStep: isFinalStep || false,
        expectedDuration,
        notes
      },
      include: { workstation: true }
    })

    res.status(201).json(route)
  } catch (error) {
    console.error('Add route error:', error)
    res.status(500).json({ error: 'Failed to add route' })
  }
})

// Delete route
router.delete('/:id/routes/:routeId', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.productRoute.delete({
      where: { id: req.params.routeId }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete route error:', error)
    res.status(500).json({ error: 'Failed to delete route' })
  }
})

export default router
