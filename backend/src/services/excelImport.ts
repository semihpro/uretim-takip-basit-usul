import ExcelJS from 'exceljs'
import prisma from '../models/db.js'

export interface ExcelImportResult {
  imported: number
  updated: number
  errors: string[]
}

// Import products and routes from Excel
export async function importFromExcel(fileBuffer: Buffer): Promise<ExcelImportResult> {
  const result: ExcelImportResult = {
    imported: 0,
    updated: 0,
    errors: []
  }

  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(fileBuffer)

    // Sheet 1: Products (Ürünler)
    const productsSheet = workbook.getWorksheet('Urunler') || workbook.getWorksheet('Products')
    if (!productsSheet) {
      result.errors.push('Sheet "Urunler" or "Products" not found')
      return result
    }

    // Sheet 2: Routes (Rotasyon)
    const routesSheet = workbook.getWorksheet('Rotasyon') || workbook.getWorksheet('Routes')

    // Parse products
    const productsData: Map<string, { code: string; name: string; parentCode?: string; unit?: string }> = new Map()
    let currentProductCode = ''
    
    productsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header
      
      const code = String(row.getCell(1).value || '').trim()
      const name = String(row.getCell(2).value || '').trim()
      const parentCode = String(row.getCell(3).value || '').trim() || undefined
      const unit = String(row.getCell(4).value || '').trim() || undefined

      if (code && name) {
        productsData.set(code, { code, name, parentCode, unit })
        currentProductCode = code
      }
    })

    // Create products
    for (const [code, data] of productsData) {
      try {
        // Resolve parent based on parentCode
        let parentId: string | null = null
        let level = data.level || 1

        if (data.parentCode) {
          const parent = await prisma.product.findUnique({ where: { code: data.parentCode } })
          if (parent) {
            parentId = parent.id
            // Auto-calculate level from parent if not explicitly set
            if (data.level === undefined || data.level === 0) {
              level = parent.level + 1
            }
          } else if (productsData.has(data.parentCode)) {
            // Parent will be created in this batch - skip for now
          }
        }

        // Check if exists
        const existing = await prisma.product.findUnique({ where: { code } })

        if (existing) {
          await prisma.product.update({
            where: { code },
            data: {
              name: data.name,
              unit: data.unit,
              level,
              parentId
            }
          })
          result.updated++
        } else {
          await prisma.product.create({
            data: {
              code,
              name: data.name,
              parentId,
              level,
              unit: data.unit
            }
          })
          result.imported++
        }
      } catch (e: any) {
        result.errors.push(`Product ${code}: ${e.message}`)
      }
    }

    // Second pass: update parentIds for products whose parents were in the batch
    for (const [code, data] of productsData) {
      if (data.parentCode && productsData.has(data.parentCode)) {
        const product = await prisma.product.findUnique({ where: { code } })
        const parent = await prisma.product.findUnique({ where: { code: data.parentCode } })
        
        if (product && parent && !product.parentId) {
          await prisma.product.update({
            where: { id: product.id },
            data: { 
              parentId: parent.id, 
              level: parent.level + 1 
            }
          })
        }
      }
    }

    // Parse and create routes
    if (routesSheet) {
      for (let rowNumber = 2; rowNumber <= routesSheet.rowCount; rowNumber++) {
        const row = routesSheet.getRow(rowNumber)
        
        const productCode = String(row.getCell(1).value || '').trim()
        const stationCode = String(row.getCell(2).value || '').trim()
        const stepOrder = Number(row.getCell(3).value) || 1
        const isFinal = String(row.getCell(4).value || '').toLowerCase() === 'evet' || 
                        String(row.getCell(4).value || '').toLowerCase() === 'yes' ||
                        String(row.getCell(4).value || '').toLowerCase() === 'true' ||
                        row.getCell(4).value === true

        if (!productCode || !stationCode) continue

        try {
          // Find product and workstation
          const product = await prisma.product.findUnique({ where: { code: productCode } })
          const workstation = await prisma.workstation.findUnique({ where: { code: stationCode } })

          if (!product) {
            result.errors.push(`Product ${productCode} not found for route`)
            continue
          }

          if (!workstation) {
            result.errors.push(`Workstation ${stationCode} not found`)
            continue
          }

          // Check if route exists
          const existingRoute = await prisma.productRoute.findFirst({
            where: {
              productId: product.id,
              workstationId: workstation.id,
              stepOrder
            }
          })

          if (!existingRoute) {
            await prisma.productRoute.create({
              data: {
                productId: product.id,
                workstationId: workstation.id,
                stepOrder,
                isFinalStep: isFinal
              }
            })
          }
        } catch (e: any) {
          result.errors.push(`Route ${productCode}/${stationCode}: ${e.message}`)
        }
      }
    }

    return result
  } catch (e: any) {
    return {
      imported: 0,
      updated: 0,
      errors: [`Excel parsing error: ${e.message}`]
    }
  }
}
