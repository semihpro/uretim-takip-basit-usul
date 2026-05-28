'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { productsApi } from '@/lib/api'
import { Plus, ChevronRight, ChevronDown, Edit, Trash2, Route, Search } from 'lucide-react'

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({ code: '', name: '', unit: '', parentId: '' })

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.tree().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowForm(false)
      setFormData({ code: '', name: '', unit: '', parentId: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setSelectedProduct(null)
    },
  })

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setFormData({
      code: product.code,
      name: product.name,
      unit: product.unit || '',
      parentId: product.parentId || ''
    })
    setShowForm(true)
  }

  if (isLoading) return <div className="animate-pulse">Yükleniyor...</div>

  // Filter products by search
  const filterProducts = (products: any[], term: string): any[] => {
    if (!term) return products
    return products.filter(p => 
      p.code.toLowerCase().includes(term.toLowerCase()) ||
      p.name.toLowerCase().includes(term.toLowerCase())
    ).map(p => ({
      ...p,
      children: filterProducts(p.children || [], term)
    }))
  }

  const filteredProducts = filterProducts(products || [], searchTerm)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ürünler (BOM)</h1>
        <button
          onClick={() => { setShowForm(true); setEditingProduct(null); setFormData({ code: '', name: '', unit: '', parentId: '' }) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Yeni Ürün
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Ürün ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Product Tree */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Ürün Ağacı</h2>
            <p className="text-sm text-gray-500">Hiyerarşik ürün yapısı</p>
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>👆 Seviye 1 (Ana Ürün)</span>
            <span>👇 Alt Ürünler</span>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredProducts?.map((product: any) => (
            <ProductTreeItem
              key={product.id}
              product={product}
              level={1}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
              onSelect={setSelectedProduct}
              onEdit={handleEdit}
              onDelete={(id: string) => deleteMutation.mutate(id)}
              searchTerm={searchTerm}
            />
          ))}
          {(!filteredProducts || filteredProducts.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz ürün yok. Excel ile import edebilirsiniz.'}
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Panel */}
      {selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">Kod: {selectedProduct.code}</p>
            </div>
            <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Seviye</p>
              <p className="font-medium">{selectedProduct.level}</p>
            </div>
            <div>
              <p className="text-gray-500">Birim</p>
              <p className="font-medium">{selectedProduct.unit || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Alt Ürün</p>
              <p className="font-medium">{(selectedProduct as any).children?.length || 0}</p>
            </div>
          </div>

          {/* Routes */}
          {(selectedProduct as any).routes?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Üretim Rotası</h4>
              <div className="flex gap-2 flex-wrap">
                {(selectedProduct as any).routes.map((route: any, idx: number) => (
                  <div key={route.id} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                    route.isFinalStep ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <span className="font-medium">{idx + 1}.</span>
                    <span>{route.workstation?.name || route.workstationId}</span>
                    {route.isFinalStep && <span className="text-xs">(Son)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kod *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
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
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="adet, kg, mt..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg">
                  İptal
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">
                  {editingProduct ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductTreeItem({ product, level, expandedIds, onToggle, onSelect, onEdit, onDelete, searchTerm }: any) {
  const hasChildren = product.children?.length > 0
  const isExpanded = expandedIds.has(product.id)
  const paddingLeft = (level - 1) * 24 + 16

  return (
    <div>
      <div
        className="flex items-center gap-2 p-4 hover:bg-gray-50 cursor-pointer"
        style={{ paddingLeft }}
        onClick={() => onSelect(product)}
      >
        {hasChildren && (
          <button onClick={(e) => { e.stopPropagation(); onToggle(product.id) }}>
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{product.name}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{product.code}</span>
          </div>
          {product.unit && <span className="text-sm text-gray-500">{product.unit}</span>}
        </div>

        <div className="flex items-center gap-2">
          {(product as any).routes?.length > 0 && (
            <span className="p-1 bg-blue-100 rounded text-blue-600" title="Rota tanımlı">
              <Route className="w-4 h-4" />
            </span>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit(product) }} className="p-1 text-gray-400 hover:text-gray-600">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(product.id) }} className="p-1 text-gray-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        product.children.map((child: any) => (
          <ProductTreeItem
            key={child.id}
            product={child}
            level={level + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            searchTerm={searchTerm}
          />
        ))
      )}
    </div>
  )
}
