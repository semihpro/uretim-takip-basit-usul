import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Routes
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import workstationRoutes from './routes/workstations.js'
import orderRoutes from './routes/orders.js'
import scanRoutes from './routes/scans.js'
import dashboardRoutes from './routes/dashboard.js'
import excelRoutes from './routes/excel.js'
import unitRoutes from './routes/units.js'
import userRoutes from './routes/users.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language']
}))
app.use(express.json())

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/workstations', workstationRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/scans', scanRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/excel', excelRoutes)
app.use('/api/units', unitRoutes)
app.use('/api/users', userRoutes)

// Error handling
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         ÜRETİM TAKİP MİNİMAX - BACKEND                   ║
║                    API Server                            ║
╠════════════════════════════════════════════════════════════╣
║  Status:   Running                                        ║
║  Port:     ${PORT}                                           ║
║  Env:      ${process.env.NODE_ENV || 'development'}                              ║
║  Health:   http://localhost:${PORT}/health                   ║
║  API Docs: http://localhost:${PORT}/api/*                    ║
╚════════════════════════════════════════════════════════════╝
  `)
})

export default app
