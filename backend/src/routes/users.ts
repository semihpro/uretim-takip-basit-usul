import { Router, Response } from 'express'
import prisma from '../models/db.js'
import { authMiddleware, AuthRequest, requireRole } from '../services/auth.js'
import bcrypt from 'bcryptjs'

const router = Router()

// Get all users
router.get('/', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        badgeId: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Get single user
router.get('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        badgeId: true,
        isActive: true,
        createdAt: true,
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Create user
router.post('/', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName, role, badgeId } = req.body

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Email, password, fullName and role are required' })
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
        badgeId: badgeId || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        badgeId: true,
        isActive: true,
        createdAt: true,
      }
    })

    res.status(201).json(user)
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// Update user
router.put('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName, role, badgeId, isActive, password } = req.body

    const data: any = {
      email,
      fullName,
      role,
      badgeId: badgeId || null,
      isActive,
    }

    // Update password if provided
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        badgeId: true,
        isActive: true,
        createdAt: true,
      }
    })

    res.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Delete user
router.delete('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    // Prevent deleting own account
    if (req.userId === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
