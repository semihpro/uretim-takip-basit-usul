'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ordersApi, productsApi } from '@/lib/api'
import { Plus, Eye, CheckCircle, XCircle, Play, ClipboardList } from 'lucide-react'

export default function OrdersPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [formData, setFormData] = useState({ orderNo: '', productId: '', quantity: 1, dueDate: '', notes: '' })

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.list({ status: statusFilter || undefined }).then(res => res.data),
  })

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowForm(false)
      setFormData({ orderNo: '', productId: '', quantity: 1, dueDate: '', notes: '' })
    },
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => ordersApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (selectedOrder) queryClient.invalidateQueries({ queryKey: ['order', selectedOrder.id] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const viewOrder = (order: any) => {
    router.push(`/orders/${order.id}`)
  }

  if (isLoading) return <div className="animate-pulse">Yükleniyor...</div>

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Üretim Emirleri</h1>
          <p className="text-gray-500">Üretim emirlerini oluştur ve takip et</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Yeni Emir
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'in_progress', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === '' ? 'Tümü' : statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Emir No</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Ürün</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Adet</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Durum</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tarih</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders?.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{order.orderNo}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-900">{order.product?.name || '-'}</span>
                  <span className="text-sm text-gray-400 ml-2">{order.product?.code}</span>
                </td>
                <td className="px-6 py-4 text-gray-900">{order.quantity}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => viewOrder(order)} className="p-2 text-gray-400 hover:text-indigo-600" title="Detay">
                      <Eye className="w-4 h-4" />
                    </button>
                    {order.status === 'draft' && (
                      <button onClick={() => confirmMutation.mutate(order.id)} className="p-2 text-gray-400 hover:text-green-600" title="Onayla">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button onClick={() => cancelMutation.mutate(order.id)} className="p-2 text-gray-400 hover:text-red-600" title="İptal">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <div className="p-12 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Henüz emri yok. Yeni emir oluşturun.</p>
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Yeni Üretim Emri</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emir No *</label>
                <input
                  type="text"
                  value={formData.orderNo}
                  onChange={(e) => setFormData({...formData, orderNo: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="EMR-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Ürün seçin...</option>
                  {products?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adet *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termin Tarihi</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg">
                  İptal
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
