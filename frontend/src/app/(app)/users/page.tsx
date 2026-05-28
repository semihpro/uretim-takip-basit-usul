'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { Plus, Pencil, Trash2, Users, X } from 'lucide-react'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'operator',
    badgeId: '',
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingUser(null)
    setFormData({ email: '', password: '', fullName: '', role: 'operator', badgeId: '' })
  }

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      fullName: user.fullName,
      role: user.role,
      badgeId: user.badgeId || '',
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: formData,
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    supervisor: 'Supervisor',
    operator: 'Operator',
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    supervisor: 'bg-blue-100 text-blue-700',
    operator: 'bg-gray-100 text-gray-700',
  }

  if (isLoading) {
    return <div className="animate-pulse">Yukleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanicilar</h1>
          <p className="text-gray-500">Kullanici yonetimi</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Yeni Kullanici
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Ad Soyad</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">E-mail</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rol</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Badge ID</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Durum</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{user.fullName}</span>
                </td>
                <td className="px-6 py-4 text-gray-900">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-sm">{user.badgeId || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-gray-400 hover:text-indigo-600"
                      title="Duzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          if (confirm('Kullaniciyi silmek istediginize emin misiniz?')) {
                            deleteMutation.mutate(user.id)
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!users || users.length === 0) && (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Henuz kullanici yok. Yeni kullanici ekleyin.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingUser ? 'Kullanici Duzenle' : 'Yeni Kullanici'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sifre {editingUser ? '(bos birakirsaniz degismez)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  {...(!editingUser && { required: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="operator">Operator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge ID</label>
                <input
                  type="text"
                  value={formData.badgeId}
                  onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-2 border rounded-lg">
                  Iptal
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">
                  {editingUser ? 'Guncelle' : 'Olustur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
