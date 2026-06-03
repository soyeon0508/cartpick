'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Brand {
  id: number
  name: string
  nameEn?: string | null
  slug: string
  logoUrl?: string | null
  isActive: boolean
}

interface ApiResponse {
  success: boolean
  data: { items: Brand[]; totalCount: number }
}

const emptyForm = { name: '', nameEn: '', slug: '', logoUrl: '', isActive: true }

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => { fetchBrands() }, [])

  const fetchBrands = async () => {
    setLoading(true)
    try {
      const response = await api.get<ApiResponse>('/admin/v1/brands', { params: { limit: 100 } })
      setBrands(response.data.data.items)
      setTotalCount(response.data.data.totalCount)
    } catch {
      setError('브랜드 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await api.post('/admin/v1/brands', {
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        slug: formData.slug,
        logoUrl: formData.logoUrl || undefined,
        isActive: formData.isActive,
      })
      closeModal()
      fetchBrands()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '브랜드 생성에 실패했습니다')
    }
  }

  const handleUpdate = async () => {
    if (!editingBrand) return
    try {
      await api.put(`/admin/v1/brands/${editingBrand.id}`, {
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        slug: formData.slug,
        logoUrl: formData.logoUrl || undefined,
        isActive: formData.isActive,
      })
      closeModal()
      fetchBrands()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '브랜드 수정에 실패했습니다')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 브랜드를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/admin/v1/brands/${id}`)
      fetchBrands()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '삭제에 실패했습니다')
    }
  }

  const openModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({
        name: brand.name,
        nameEn: brand.nameEn || '',
        slug: brand.slug,
        logoUrl: brand.logoUrl || '',
        isActive: brand.isActive,
      })
    } else {
      setEditingBrand(null)
      setFormData(emptyForm)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBrand(null)
    setFormData(emptyForm)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          브랜드 {totalCount > 0 && <span className="text-base font-normal text-gray-500">({totalCount}개)</span>}
        </h1>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          브랜드 추가
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">브랜드명</th>
              <th className="px-4 py-3">영문명</th>
              <th className="px-4 py-3">슬러그</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">브랜드가 없습니다</td></tr>
            ) : brands.map(brand => (
              <tr key={brand.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-7 w-7 rounded object-contain" />}
                    <span className="font-medium text-gray-900">{brand.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{brand.nameEn || '-'}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{brand.slug}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {brand.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <button onClick={() => openModal(brand)} className="text-blue-600 hover:text-blue-800 text-xs underline">수정</button>
                  <button onClick={() => handleDelete(brand.id)} className="text-red-500 hover:text-red-700 text-xs underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingBrand ? '브랜드 수정' : '브랜드 추가'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">브랜드명 *</label>
                <input type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">영문명</label>
                <input type="text" value={formData.nameEn}
                  onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">슬러그 *</label>
                <input type="text" value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder="example-slug" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">로고 URL</label>
                <input type="text" value={formData.logoUrl}
                  onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                <label htmlFor="isActive" className="text-sm text-gray-700">활성</label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">취소</button>
              <button onClick={editingBrand ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                {editingBrand ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
