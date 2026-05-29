'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { excelApi } from '@/lib/api'
import { Upload, FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react'
import { AxiosError } from 'axios'
import * as XLSX from 'xlsx'

export default function ExcelPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<any>(null)

  const importMutation = useMutation({
    mutationFn: (file: File) => excelApi.importProducts(file),
    onSuccess: (res) => {
      setImportResult(res.data)
      setFile(null)
    },
    onError: (err) => {
      const axiosError = err as AxiosError
      setImportResult({
        success: false,
        imported: 0,
        updated: 0,
        errors: [(axiosError.response?.data as any)?.error || 'Import failed']
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setImportResult({
          success: false,
          errors: ['Sadece Excel dosyasi (.xlsx, .xls) kabul edilir']
        })
        return
      }
      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const handleImport = () => {
    if (file) {
      importMutation.mutate(file)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await excelApi.getTemplate()
      const template = response.data
      
      // Create workbook with both sheets
      const workbook = XLSX.utils.book_new()
      
      // Sheet 1: Urunler
      const productsData = [
        ['kod', 'ad', 'ust_kod', 'birim'],
        ...template.products.map(p => [p.kod, p.ad, p.ust_kod, p.birim])
      ]
      const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Urunler')
      
      // Sheet 2: Rotasyon
      const routesData = [
        ['urun_kod', 'istasyon_kod', 'sira', 'son_adim'],
        ...template.routes.map(r => [r.urun_kod, r.istasyon_kod, r.sira, r.son_adim])
      ]
      const routesSheet = XLSX.utils.aoa_to_sheet(routesData)
      XLSX.utils.book_append_sheet(workbook, routesSheet, 'Rotasyon')
      
      // Download Excel file
      XLSX.writeFile(workbook, 'uretim_sablon.xlsx')
    } catch (err) {
      console.error('Template download failed:', err)
      alert('Sablon indirilemedi. Lutfen tekrar deneyin.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Excel Import</h1>
          <p className="text-gray-500">Excel dosyasindan urun ve rota yukle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Dosya Yukle</h2>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              file ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file"
            />
            <label htmlFor="excel-file" className="cursor-pointer">
              <FileSpreadsheet className={`w-12 h-12 mx-auto mb-4 ${file ? 'text-indigo-600' : 'text-gray-400'}`} />
              {file ? (
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-900">Excel dosyasi secin</p>
                  <p className="text-sm text-gray-500">.xlsx veya .xls formati</p>
                </div>
              )}
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
            className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {importMutation.isPending ? 'Import ediliyor...' : 'Import Et'}
          </button>
        </div>

        {/* Result */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Sonuc</h2>

          {!importResult && (
            <div className="text-center py-12 text-gray-400">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Henuz import yapilmadi</p>
            </div>
          )}

          {importResult && (
            <div className={`rounded-xl p-6 ${
              importResult.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {importResult.success ? (
                  <Check className="w-10 h-10 text-green-600" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-red-600" />
                )}
                <div>
                  <p className={`text-lg font-bold ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {importResult.success ? 'Import Basarili' : 'Import Hatalli'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.imported || 0}</p>
                  <p className="text-sm text-gray-500">Eklendi</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{importResult.updated || 0}</p>
                  <p className="text-sm text-gray-500">Guncellendi</p>
                </div>
              </div>

              {importResult.errors?.length > 0 && (
                <div className="mt-4 p-4 bg-white/50 rounded-lg">
                  <p className="font-medium text-red-700 mb-2">Hatalar:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {importResult.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Template Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Excel Sablonu</h2>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
          >
            <Download className="w-4 h-4" />
            Excel Sablonu Indir
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Yukaridaki butondan ornek Excel sablonunu indirebilirsiniz. Iki sheet icerir:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Sheet 1: Urunler</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><code>kod</code> - Urun kodu (benzersiz)</li>
              <li><code>ad</code> - Urun adi</li>
              <li><code>ust_kod</code> - Ust urunun kodu (bos = ana urun)</li>
              <li><code>birim</code> - Birim (adet, kg, mt...)</li>
            </ul>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-2">Sheet 2: Rotasyon</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li><code>urun_kod</code> - Urunun kodu</li>
              <li><code>istasyon_kod</code> - İstasyonun kodu</li>
              <li><code>sira</code> - Adim sirasi (1, 2, 3...)</li>
              <li><code>son_adim</code> - Son adim mi? (Evet/Hayir)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
