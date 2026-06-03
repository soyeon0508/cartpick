'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Category {
  id: number
  name: string
  slug: string
  countryId: number
  parentId?: number | null
  depth: number
  isActive: boolean
  parent?: { id: number; name: string } | null
}

interface ApiResponse {
  success: boolean
  data: Category[]
}

const emptyForm = { name: '', slug: '', countryId: '', parentId: '', displayOrder: '', isActive: true }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await api.get<ApiResponse>('/admin/v1/categories')
      setCategories(response.data.data)
    } catch {
      setError('카테고리 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await api.post('/admin/v1/categories', {
        name: formData.name,
        slug: formData.slug,
        countryId: Number(formData.countryId),
        parentId: formData.parentId ? Number(formData.parentId) : undefined,
        displayOrder: formData.displayOrder ? Number(formData.displayOrder) : undefined,
        isActive: formData.isActive,
      })
      closeModal()
      fetchCategories()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '카테고리 생성에 실패했습니다')
    }
  }

  const handleUpdate = async () => {
    if (!editingCategory) return
    try {
      await api.put(`/admin/v1/categories/${editingCategory.id}`, {
        name: formData.name,
        slug: formData.slug,
        countryId: Number(formData.countryId),
        parentId: formData.parentId ? Number(formData.parentId) : undefined,
        displayOrder: formData.displayOrder ? Number(formData.displayOrder) : undefined,
        isActive: formData.isActive,
      })
      closeModal()
      fetchCategories()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '카테고리 수정에 실패했습니다')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/admin/v1/categories/${id}`)
      fetchCategories()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '삭제에 실패했습니다')
    }
  }

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        countryId: String(category.countryId),
        parentId: category.parentId ? String(category.parentId) : '',
        displayOrder: '',
        isActive: category.isActive,
      })
    } else {
      setEditingCategory(null)
      setFormData(emptyForm)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData(emptyForm)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          카테고리 {categories.length > 0 && <span className="text-base font-normal text-gray-500">({categories.length}개)</span>}
        </h1>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          카테고리 추가
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">카테고리명</th>
              <th className="px-4 py-3">슬러그</th>
              <th className="px-4 py-3">상위</th>
              <th className="px-4 py-3">깊이</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">카테고리가 없습니다</td></tr>
            ) : categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900" style={{ paddingLeft: `${(cat.depth + 1) * 16}px` }}>
                  {cat.depth > 0 && <span className="text-gray-400 mr-1">└</span>}
                  {cat.name}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-500">{cat.parent?.name ?? '-'}</td>
                <td className="px-4 py-3 text-gray-400">{cat.depth}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <button onClick={() => openModal(cat)} className="text-blue-600 hover:text-blue-800 text-xs underline">수정</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 text-xs underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCategory ? '카테고리 수정' : '카테고리 추가'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리명 *</label>
                <input type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">슬러그 *</label>
                <input type="text" value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder="example-slug" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">국가 ID *</label>
                <input type="number" value={formData.countryId}
                  onChange={e => setFormData({ ...formData, countryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상위 카테고리 ID</label>
                <input type="number" value={formData.parentId}
                  onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="없으면 비워두세요" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
                <input type="number" value={formData.displayOrder}
                  onChange={e => setFormData({ ...formData, displayOrder: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="catIsActive" checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                <label htmlFor="catIsActive" className="text-sm text-gray-700">활성</label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">취소</button>
              <button onClick={editingCategory ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                {editingCategory ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
