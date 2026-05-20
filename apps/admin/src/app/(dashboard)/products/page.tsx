'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Product {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  status: string
  reviewCount: number
  createdAt: string
  brand?: { id: number; name: string }
  category?: { id: number; name: string }
}

interface ApiResponse {
  success: boolean
  data: { items: Product[]; totalCount: number }
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchProducts()
  }, [offset])

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await api.get<ApiResponse>('/admin/v1/products', {
        params: { limit, offset },
      })
      setProducts(res.data.data.items)
      setTotalCount(res.data.data.totalCount)
    } catch {
      setError('상품 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: number, currentStatus: string) {
    const next = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await api.put(`/admin/v1/products/${id}`, { status: next })
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: next } : p))
    } catch {
      alert('상태 변경에 실패했습니다')
    }
  }

  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(totalCount / limit)

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-red-100 text-red-700',
      draft: 'bg-yellow-100 text-yellow-700',
    }
    return map[status] ?? 'bg-gray-100 text-gray-600'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">상품 관리 {totalCount > 0 && <span className="text-base font-normal text-gray-500">({totalCount}개)</span>}</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">상품명</th>
              <th className="px-4 py-3">브랜드</th>
              <th className="px-4 py-3">카테고리</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">리뷰</th>
              <th className="px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">상품이 없습니다</td></tr>
            ) : products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    )}
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{product.brand?.name ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500">{product.category?.name ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{product.reviewCount}</td>
                <td className="px-4 py-3 flex gap-3">
                  <button
                    onClick={() => handleStatusChange(product.id, product.status)}
                    className="text-gray-500 hover:text-gray-800 text-xs underline"
                  >
                    {product.status === 'active' ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center text-sm">
          <button
            onClick={() => setOffset(o => Math.max(0, o - limit))}
            disabled={offset === 0}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            이전
          </button>
          <span className="text-gray-500">{page} / {totalPages} 페이지</span>
          <button
            onClick={() => setOffset(o => o + limit)}
            disabled={page >= totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
