'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi, ordersApi, scansApi } from '@/lib/api'
import { LayoutDashboard, Package, ClipboardList, ScanBarcode, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(res => res.data),
    refetchInterval: 30000,
  })

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.list({ limit: 5 }).then(res => res.data),
  })

  const { data: recentScans } = useQuery({
    queryKey: ['recent-scans'],
    queryFn: () => scansApi.history({ limit: 10 }).then(res => res.data),
  })

  if (statsLoading) {
    return <div className="animate-pulse">Yukleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">Son guncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aktif Emirler</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.orders?.in_progress || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bugunku Taramalar</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.todayScans || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ScanBarcode className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tamamlanan</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.completedToday || 0}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Emir</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.orders?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-700">Hazirlaniyor</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-1">{stats?.orders?.draft || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-700">Uretimde</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-1">{stats?.orders?.in_progress || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">Tamamlandi</span>
          </div>
          <p className="text-2xl font-bold text-green-800 mt-1">{stats?.orders?.completed || 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">Iptal</span>
          </div>
          <p className="text-2xl font-bold text-red-800 mt-1">{stats?.orders?.cancelled || 0}</p>
        </div>
      </div>

      {/* Daily Scan Trends Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">7 Gunluk Tarama Trendi</h2>
        </div>
        <div className="p-6">
          {stats?.dailyScans && stats.dailyScans.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-40">
              {stats.dailyScans.map((day: any, index: number) => {
                const maxCount = Math.max(...stats.dailyScans.map((d: any) => d.count), 1)
                const height = (day.count / maxCount) * 100
                const date = new Date(day.date)
                const dayLabel = date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center h-32">
                      <div
                        className="w-full max-w-12 bg-indigo-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                        title={day.count + ' tarama'}
                      >
                        {day.count > 0 && (
                          <span className="text-xs text-white font-medium block text-center pt-1">
                            {day.count}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Henuz tarama verisi yok</div>
          )}
        </div>
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Son Emirler</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders?.map((order: any) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{order.orderNo}</p>
                  <p className="text-sm text-gray-500">{order.product?.name || 'Urun'}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status === 'draft' ? 'Hazirlaniyor' :
                     order.status === 'in_progress' ? 'Uretimde' :
                     order.status === 'completed' ? 'Tamamlandi' : 'Iptal'}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{order.quantity} adet</p>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <div className="p-8 text-center text-gray-500">Henuz emir yok</div>
            )}
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Son Taramalar</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {recentScans?.map((scan: any) => (
              <div key={scan.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{scan.unit?.barcode || 'Barkod'}</p>
                  <p className="text-sm text-gray-500">{scan.workstation?.name || 'Istasyon'}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    scan.result === 'accepted' ? 'bg-green-100 text-green-700' :
                    scan.result === 'wrong_station' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {scan.result === 'accepted' ? 'Kabul' :
                     scan.result === 'wrong_station' ? 'Yanlis Ist.' : 'Red'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(scan.createdAt).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              </div>
            ))}
            {(!recentScans || recentScans.length === 0) && (
              <div className="p-8 text-center text-gray-500">Henuz tarama yok</div>
            )}
          </div>
        </div>
      </div>

      {/* Workstation Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Istasyon Bazli Taramalar (Bugun)</h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {stats?.workstationStats?.map((ws: any) => (
            <div key={ws.id} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{ws.code}</p>
              <p className="text-2xl font-bold text-indigo-600">{ws.scanCount}</p>
              <p className="text-xs text-gray-500">tarama</p>
            </div>
          ))}
          {(!stats?.workstationStats || stats.workstationStats.length === 0) && (
            <div className="col-span-full text-center text-gray-500 py-8">Veri yok</div>
          )}
        </div>
      </div>
    </div>
  )
}
