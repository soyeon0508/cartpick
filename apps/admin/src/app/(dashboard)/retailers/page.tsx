'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Retailer {
  id: number
  name: string
  slug: string
  countryId: number
  retailerType: string
  logoUrl?: string | null
  launchStatus?: string | null
  isActive: boolean
  displayOrder?: number | null
}

interface ApiResponse {
  success: boolean
  data: Retailer[]
}

const emptyForm = {
  name: '', slug: '', countryId: '', retailerType: 'ONLINE',
  logoUrl: '', launchStatus: 'LIVE', displayOrder: '', isActive: true,
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => { fetchRetailers() }, [])

  const fetchRetailers = async () => {
    setLoading(true)
    try {
      const response = await api.get<ApiResponse>('/admin/v1/retailers')
      setRetailers(response.data.data)
    } catch {
      setError('리테일러 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await api.post('/admin/v1/retailers', {
        name: formData.name,
        slug: formData.slug,
        countryId: Number(formData.countryId),
        retailerType: formData.retailerType,
        logoUrl: formData.logoUrl || undefined,
        launchStatus: formData.launchStatus || undefined,
        displayOrder: formData.displayOrder ? Number(formData.displayOrder) : undefined,
        isActive: formData.isActive,
      })
      closeModal()
      fetchRetailers()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '리테일러 생성에 실패했습니다')
    }
  }

  const handleUpdate = async () => {
    if (!editingRetailer) return
    try {
      await api.put(`/admin/v1/retailers/${editingRetailer.id}`, {
        name: formData.name,
        slug: formData.slug,
        countryId: Number(formData.countryId),
        retailerType: formData.retailerType,
        logoUrl: formData.logoUrl || undefined,
        launchStatus: formData.launchStatus || undefined,
        displayOrder: formData.displayOrder ? Number(formData.displayOrder) : undefined,
        isActive: formData.isActive,
      })
      closeModal()
      fetchRetailers()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '리테일러 수정에 실패했습니다')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 리테일러를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/admin/v1/retailers/${id}`)
      fetchRetailers()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '삭제에 실패했습니다')
    }
  }

  const openModal = (retailer?: Retailer) => {
    if (retailer) {
      setEditingRetailer(retailer)
      setFormData({
        name: retailer.name,
        slug: retailer.slug,
        countryId: String(retailer.countryId),
        retailerType: retailer.retailerType,
        logoUrl: retailer.logoUrl || '',
        launchStatus: retailer.launchStatus || 'LIVE',
        displayOrder: retailer.displayOrder != null ? String(retailer.displayOrder) : '',
        isActive: retailer.isActive,
      })
    } else {
      setEditingRetailer(null)
      setFormData(emptyForm)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRetailer(null)
    setFormData(emptyForm)
  }

  const retailerTypeLabel: Record<string, string> = {
    ONLINE: '온라인', OFFLINE: '오프라인', HYBRID: '혼합',
  }
  const launchStatusLabel: Record<string, string> = {
    LIVE: '운영중', COMING_SOON: '준비중', CLOSED: '종료',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          리테일러 {retailers.length > 0 && <span className="text-base font-normal text-gray-500">({retailers.length}개)</span>}
        </h1>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          리테일러 추가
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">리테일러</th>
              <th className="px-4 py-3">슬러그</th>
              <th className="px-4 py-3">타입</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">활성</th>
              <th className="px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : retailers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">리테일러가 없습니다</td></tr>
            ) : retailers.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.logoUrl && <img src={r.logoUrl} alt="" className="h-7 w-7 rounded object-contain" />}
                    <span className="font-medium text-gray-900">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.slug}</td>
                <td className="px-4 py-3 text-gray-500">{retailerTypeLabel[r.retailerType] ?? r.retailerType}</td>
                <td className="px-4 py-3 text-gray-500">{launchStatusLabel[r.launchStatus ?? ''] ?? r.launchStatus ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <button onClick={() => openModal(r)} className="text-blue-600 hover:text-blue-800 text-xs underline">수정</button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-xs underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingRetailer ? '리테일러 수정' : '리테일러 추가'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">타입 *</label>
                <select value={formData.retailerType}
                  onChange={e => setFormData({ ...formData, retailerType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="ONLINE">온라인</option>
                  <option value="OFFLINE">오프라인</option>
                  <option value="HYBRID">혼합</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">운영 상태</label>
                <select value={formData.launchStatus}
                  onChange={e => setFormData({ ...formData, launchStatus: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="LIVE">운영중</option>
                  <option value="COMING_SOON">준비중</option>
                  <option value="CLOSED">종료</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">로고 URL</label>
                <input type="text" value={formData.logoUrl}
                  onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
                <input type="number" value={formData.displayOrder}
                  onChange={e => setFormData({ ...formData, displayOrder: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="retIsActive" checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                <label htmlFor="retIsActive" className="text-sm text-gray-700">활성</label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">취소</button>
              <button onClick={editingRetailer ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                {editingRetailer ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
