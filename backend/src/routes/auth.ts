import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../models/db.js'
import { generateToken, authMiddleware, AuthRequest } from '../services/auth.js'

const router = Router()

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken({ userId: user.id, role: user.role })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        badgeId: user.badgeId
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Badge login
router.post('/login-badge', async (req: Request, res: Response) => {
  try {
    const { badgeId, pin } = req.body

    if (!badgeId || !pin) {
      return res.status(400).json({ error: 'Badge ID and PIN are required' })
    }

    const user = await prisma.user.findUnique({ where: { badgeId } })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid badge' })
    }

    const isValid = await bcrypt.compare(pin, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    const token = generateToken({ userId: user.id, role: user.role })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        badgeId: user.badgeId
      }
    })
  } catch (error) {
    console.error('Badge login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        badgeId: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

export default router
