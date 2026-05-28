'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { workstationsApi } from '@/lib/api'
import { Plus, Edit, Trash2, Settings, Check } from 'lucide-react'

export default function WorkstationsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formData, setFormData] = useState({ code: '', name: '', description: '' })

  const { data: workstations, isLoading } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => workstationsApi.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => data.id ? workstationsApi.update(data.id, data) : workstationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstations'] })
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workstationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workstations'] }),
  })

  const seedMutation = useMutation({
    mutationFn: () => workstationsApi.seedDefaults(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workstations'] }),
  })

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setFormData({ code: '', name: '', description: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(editing?.id ? { ...formData, id: editing.id } : formData)
  }

  const handleEdit = (ws: any) => {
    setEditing(ws)
    setFormData({ code: ws.code, name: ws.name, description: ws.description || '' })
    setShowForm(true)
  }

  if (isLoading) return <div className="animate-pulse">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İş İstasyonları</h1>
          <p className="text-gray-500">Üretim hattı istasyonlarını yönet</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => seedMutation.mutate()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Varsayılanları Ekle
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Yeni İstasyon
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {workstations?.map((ws: any) => (
          <div key={ws.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(ws)} className="p-1 text-gray-400 hover:text-indigo-600">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMutation.mutate(ws.id)} className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900">{ws.name}</h3>
              <p className="text-sm text-gray-500 font-mono">{ws.code}</p>
              {ws.description && <p className="text-xs text-gray-400 mt-1">{ws.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {(!workstations || workstations.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">İstasyon yok</h3>
          <p className="text-gray-500">Varsayılan istasyonları ekleyin veya yeni oluşturun.</p>
          <button
            onClick={() => seedMutation.mutate()}
            className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
          >
            Varsayılanları Ekle
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'İstasyon Düzenle' : 'Yeni İstasyon'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kod *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border rounded-lg uppercase"
                  placeholder="KESIM"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Kesim"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg">
                  İptal
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">
                  {editing ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
