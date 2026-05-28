import multer from 'multer'
import { Router, Request, Response } from 'express'
import prisma from '../models/db.js'
import { authMiddleware, AuthRequest, requireRole } from '../services/auth.js'
import { importFromExcel } from '../services/excelImport.js'

const router = Router()

// Configure multer for file upload (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// Import products + routes from Excel
router.post('/import-products', authMiddleware, requireRole('admin', 'supervisor'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const result = await importFromExcel(req.file.buffer)

    res.json({
      success: result.errors.length === 0,
      ...result
    })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ error: 'Import failed' })
  }
})

// Export products to Excel
router.get('/export-products', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const workbook = new ExcelJS.Workbook()

    // Products sheet
    const productsSheet = workbook.addWorksheet('Urunler')
    productsSheet.columns = [
      { header: 'kod', key: 'code', width: 20 },
      { header: 'ad', key: 'name', width: 40 },
      { header: 'ust_kod', key: 'parentCode', width: 20 },
      { header: 'birim', key: 'unit', width: 15 },
      { header: 'seviye', key: 'level', width: 10 }
    ]

    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { parent: { select: { code: true } } }
    })

    for (const p of products) {
      productsSheet.addRow({
        code: p.code,
        name: p.name,
        parentCode: p.parent?.code || '',
        unit: p.unit || '',
        level: p.level
      })
    }

    // Routes sheet
    const routesSheet = workbook.addWorksheet('Rotasyon')
    routesSheet.columns = [
      { header: 'urun_kod', key: 'productCode', width: 20 },
      { header: 'istasyon_kod', key: 'stationCode', width: 20 },
      { header: 'sira', key: 'stepOrder', width: 10 },
      { header: 'son_adim', key: 'isFinal', width: 15 }
    ]

    const routes = await prisma.productRoute.findMany({
      include: {
        product: { select: { code: true } },
        workstation: { select: { code: true } }
      }
    })

    for (const r of routes) {
      routesSheet.addRow({
        productCode: r.product.code,
        stationCode: r.workstation.code,
        stepOrder: r.stepOrder,
        isFinal: r.isFinalStep ? 'Evet' : 'Hayir'
      })
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=uretim_takip.xlsx')

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ error: 'Export failed' })
  }
})

// Download template as CSV files
router.get('/template', authMiddleware, requireRole('admin', 'supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    // Return JSON with template data - frontend will generate CSV
    const template = {
      products: [
        { kod: 'URK-001', ad: 'Ana Urun', ust_kod: '', birim: 'adet' },
        { kod: 'URK-001-01', ad: 'Alt Parca 1', ust_kod: 'URK-001', birim: 'adet' },
        { kod: 'URK-001-02', ad: 'Alt Parca 2', ust_kod: 'URK-001', birim: 'adet' }
      ],
      routes: [
        { urun_kod: 'URK-001', istasyon_kod: 'KESIM', sira: 1, son_adim: 'Hayir' },
        { urun_kod: 'URK-001', istasyon_kod: 'MONTAJ', sira: 2, son_adim: 'Evet' },
        { urun_kod: 'URK-001-01', istasyon_kod: 'BOYAMA', sira: 1, son_adim: 'Evet' }
      ]
    }
    
    res.json(template)
  } catch (error) {
    console.error('Template error:', error)
    res.status(500).json({ error: 'Template fetch failed' })
  }
})

export default router
