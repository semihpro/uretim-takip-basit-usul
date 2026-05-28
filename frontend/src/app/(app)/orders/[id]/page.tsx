'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ordersApi } from '@/lib/api'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, MapPin, Calendar } from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.get(orderId).then(res => res.data),
    enabled: !!orderId,
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="h-60 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Emir bulunamadı</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline">
          Geri dön
        </button>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    draft: 'Hazırlanıyor',
    in_progress: 'Üretimde',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
  }

  const unitStatusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const unitStatusLabels: Record<string, string> = {
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

  const totalUnits = order.units?.length || 0
  const completedUnits = order.units?.filter((u: any) => u.status === 'completed').length || 0
  const inProgressUnits = order.units?.filter((u: any) => u.status === 'in_progress').length || 0
  const pendingUnits = order.units?.filter((u: any) => u.status === 'pending').length || 0
  const rejectedUnits = order.units?.filter((u: any) => u.status === 'rejected').length || 0
  const progress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0

  // Today's stats for this order
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayScans = order.units?.reduce((count: number, unit: any) => {
    return count + (unit.scanEvents?.filter((s: any) => new Date(s.createdAt) >= today).length || 0)
  }, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/orders')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Emirler
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNo}</h1>
          <p className="text-gray-500">{order.product?.name} ({order.product?.code})</p>
        </div>
        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColors[order.status]}`}>
          {statusLabels[order.status]}
        </span>
      </div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Birim</p>
              <p className="text-xl font-bold text-gray-900">{totalUnits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tamamlanan</p>
              <p className="text-xl font-bold text-gray-900">{completedUnits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Üretimde</p>
              <p className="text-xl font-bold text-gray-900">{inProgressUnits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bugünkü Taramalar</p>
              <p className="text-xl font-bold text-gray-900">{todayScans}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">İlerleme</h2>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Bekliyor: {pendingUnits}</span>
          <span>Üretimde: {inProgressUnits}</span>
          <span>Reddedildi: {rejectedUnits}</span>
          <span>Tamamlandı: {completedUnits}</span>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Emir Detayları</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Emir No</p>
            <p className="font-medium">{order.orderNo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ürün</p>
            <p className="font-medium">{order.product?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Adet</p>
            <p className="font-medium">{order.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Termin</p>
            <p className="font-medium">
              {order.dueDate ? new Date(order.dueDate).toLocaleDateString('tr-TR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Oluşturan</p>
            <p className="font-medium">{order.createdBy?.fullName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Oluşturulma</p>
            <p className="font-medium">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : '-'}
            </p>
          </div>
        </div>
        {order.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Notlar</p>
            <p className="font-medium">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Product Route */}
      {order.product?.routes && order.product.routes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Ürün Rotası</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {order.product.routes.map((route: any, index: number) => (
              <div key={route.id} className="flex items-center">
                <div className={`flex flex-col items-center p-3 rounded-lg min-w-[100px] ${
                  index === order.product.routes.length - 1 ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <span className="text-xs text-gray-500">Adım {index + 1}</span>
                  <span className="font-medium text-sm">{route.workstation?.name}</span>
                  <span className="text-xs text-gray-400">{route.workstation?.code}</span>
                </div>
                {index < order.product.routes.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-300 mx-1"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Units Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Birim Listesi ({totalUnits})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Barkod</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Adım</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Durum</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Son Tarama</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tarama Geçmişi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.units?.map((unit: any) => {
                const lastScan = unit.scanEvents?.[0]
                const routes = order.product?.routes || []
                const currentRoute = routes[unit.currentStep]

                return (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{unit.barcode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {unit.currentStep} / {routes.length}
                        {currentRoute && (
                          <span className="text-gray-400 ml-1">({currentRoute.workstation?.name})</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${unitStatusColors[unit.status]}`}>
                        {unitStatusLabels[unit.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {lastScan ? (
                        <div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mb-1 ${scanResultColors[lastScan.result]}`}>
                            {lastScan.result === 'accepted' ? 'Kabul' :
                             lastScan.result === 'wrong_station' ? 'Yanlış İst.' :
                             lastScan.result === 'rejected' ? 'Red' : lastScan.result}
                          </span>
                          <span className="block text-xs text-gray-400">
                            {lastScan.workstation?.name} - {new Date(lastScan.createdAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {unit.scanEvents?.slice(0, 3).map((scan: any) => (
                          <span
                            key={scan.id}
                            className={`inline-flex px-2 py-0.5 text-xs rounded ${scanResultColors[scan.result]}`}
                            title={`${scan.workstation?.name} - ${new Date(scan.createdAt).toLocaleString('tr-TR')}`}
                          >
                            {scan.workstation?.code}
                          </span>
                        ))}
                        {(unit.scanEvents?.length || 0) > 3 && (
                          <span className="text-xs text-gray-400">
                            +{(unit.scanEvents?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {(!order.units || order.units.length === 0) && (
          <div className="p-12 text-center text-gray-500">
            <p>Bu emirde henüz birim oluşturulmamış.</p>
          </div>
        )}
      </div>
    </div>
  )
}
