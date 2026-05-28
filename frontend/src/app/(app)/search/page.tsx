'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { unitsApi } from '@/lib/api'
import { Search, Package, MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Barcode } from 'lucide-react'

export default function SearchPage() {
  const [barcode, setBarcode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: unit, isLoading, error } = useQuery({
    queryKey: ['unit', searchQuery],
    queryFn: () => unitsApi.search(searchQuery).then(res => res.data),
    enabled: !!searchQuery,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (barcode.trim()) {
      setSearchQuery(barcode.trim())
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Bekliyor',
    in_progress: 'Üretimde',
    completed: 'Tamamlandı',
    rejected: 'Reddedildi',
  }

  const scanResultColors: Record<string, string> = {
    accepted: 'bg-green-100 text-green-700',
    wrong_station: 'bg-orange-100 text-orange-700',
    duplicate: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-700',
  }

  const scanResultLabels: Record<string, string> = {
    accepted: 'Kabul',
    wrong_station: 'Yanlış İst.',
    duplicate: 'Tekrar',
    rejected: 'Red',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Birim Sorgula</h1>
        <p className="text-gray-500">Barkod ile birim bilgilerini sorgulayın</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Barkod numarasını girin..."
              className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Ara
          </button>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-700 font-medium">Birim bulunamadi</p>
          <p className="text-red-500 text-sm">{searchQuery} barkodu ile eslesen birim yok</p>
        </div>
      )}

      {/* Unit Details */}
      {unit && !isLoading && (
        <div className="space-y-6">
          {/* Unit Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900">{unit.barcode}</h2>
                <p className="text-gray-500">
                  {unit.order?.product?.name} ({unit.order?.product?.code})
                </p>
              </div>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColors[unit.status]}`}>
                {statusLabels[unit.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Emir No</p>
                <p className="font-medium">{unit.order?.orderNo}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Mevcut Adım</p>
                <p className="font-medium">
                  {unit.currentStep} / {unit.order?.product?.routes?.length || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Tarama Sayısı</p>
                <p className="font-medium">{unit.scanEvents?.length || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Oluşturulma</p>
                <p className="font-medium text-sm">
                  {new Date(unit.order?.createdAt || '').toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>

            {/* Rejection Reason */}
            {unit.status === 'rejected' && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">Red Nedeni</p>
                <p className="font-medium text-red-700">{unit.rejectionReason || 'Belirtilmedi'}</p>
              </div>
            )}
          </div>

          {/* Product Route */}
          {unit.order?.product?.routes && unit.order.product.routes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Ürün Rotası</h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {unit.order.product.routes.map((route: any, index: number) => {
                  const isCompleted = index < unit.currentStep
                  const isCurrent = index === unit.currentStep
                  return (
                    <div key={route.id} className="flex items-center">
                      <div className={`flex flex-col items-center p-3 rounded-lg min-w-[100px] ${
                        isCompleted ? 'bg-green-100' :
                        isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-xs text-gray-500">Adım {index + 1}</span>
                        <span className="font-medium text-sm">{route.workstation?.name}</span>
                        <span className="text-xs text-gray-400">{route.workstation?.code}</span>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-green-600 mt-1" />}
                        {isCurrent && <span className="text-xs text-blue-600 mt-1">●</span>}
                      </div>
                      {index < unit.order.product.routes.length - 1 && (
                        <div className="w-8 h-0.5 bg-gray-300 mx-1"></div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Next Station Info */}
              {unit.currentStep < (unit.order?.product?.routes?.length || 0) - 1 && unit.status !== 'rejected' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Sonraki İstasyon</p>
                    <p className="font-medium text-blue-900">
                      {unit.order?.product?.routes?.[unit.currentStep]?.workstation?.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scan History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Tarama Geçmişi ({unit.scanEvents?.length || 0})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {unit.scanEvents?.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <Barcode className="w-12 h-12 mx-auto mb-4" />
                  <p>Henüz tarama yapılmamış</p>
                </div>
              )}
              {unit.scanEvents?.map((scan: any) => (
                <div key={scan.id} className="px-6 py-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    scan.result === 'accepted' ? 'bg-green-100' :
                    scan.result === 'wrong_station' ? 'bg-orange-100' :
                    scan.result === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {scan.result === 'accepted' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {scan.result === 'wrong_station' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
                    {scan.result === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                    {scan.result === 'duplicate' && <AlertTriangle className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${scanResultColors[scan.result]}`}>
                        {scanResultLabels[scan.result]}
                      </span>
                      <span className="font-medium text-gray-900">{scan.workstation?.name}</span>
                      <span className="text-gray-400 text-sm">({scan.workstation?.code})</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {scan.scannedBy?.fullName || 'Operatör'} - {new Date(scan.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!unit && !isLoading && !error && (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Barkod girerek birim sorgulayın</p>
        </div>
      )}
    </div>
  )
}
