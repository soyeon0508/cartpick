'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'

interface Brand { id: number; name: string }
interface Category { id: number; name: string }
interface Retailer { id: number; name: string }

interface RetailerLink {
  id: number
  retailerId: number
  retailer: { id: number; name: string; slug: string; logoUrl: string | null }
  price: number | null
  salePrice: number | null
  retailerProductName: string | null
  isAvailable: boolean
  isNew: boolean
}

interface Product {
  id: number
  name: string
  normalizedName: string
  description: string | null
  imageUrl: string | null
  barcode: string | null
  volumeValue: string | null
  volumeUnit: string | null
  packageType: string | null
  status: string
  brandId: number | null
  categoryId: number
  countryId: number
  brand?: Brand
  category?: Category
}

interface ApiResponse<T> { success: boolean; data: T }

export default function ProductEditPage() {
  const router = useRouter()
  const params = useParams()
  const productId = Number(params.id)

  const [product, setProduct] = useState<Product | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [links, setLinks] = useState<RetailerLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New retailer link form state
  const [newRetailerId, setNewRetailerId] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [addingLink, setAddingLink] = useState(false)

  useEffect(() => {
    loadAll()
  }, [productId])

  async function loadAll() {
    try {
      const [productRes, brandsRes, categoriesRes, retailersRes, linksRes] = await Promise.all([
        api.get<ApiResponse<Product>>(`/admin/v1/products/${productId}`),
        api.get<ApiResponse<{ items: Brand[] }>>('/admin/v1/brands'),
        api.get<ApiResponse<Category[]>>('/admin/v1/categories'),
        api.get<ApiResponse<Retailer[]>>('/admin/v1/retailers'),
        api.get<ApiResponse<RetailerLink[]>>(`/admin/v1/retailer-products?productId=${productId}`),
      ])
      setProduct(productRes.data.data)
      setBrands(brandsRes.data.data.items)
      setCategories(categoriesRes.data.data)
      setRetailers(retailersRes.data.data)
      setLinks(linksRes.data.data)
    } catch {
      setError('데이터를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    try {
      const form = e.currentTarget
      const data = Object.fromEntries(new FormData(form))
      await api.put(`/admin/v1/products/${productId}`, {
        name: data.name,
        normalizedName: String(data.name).toLowerCase().trim(),
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        barcode: data.barcode || null,
        volumeValue: data.volumeValue || null,
        volumeUnit: data.volumeUnit || null,
        packageType: data.packageType || null,
        status: data.status,
        brandId: data.brandId ? Number(data.brandId) : null,
        categoryId: Number(data.categoryId),
      })
      router.push('/products')
    } catch {
      setError('저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddLink() {
    if (!newRetailerId) return
    setAddingLink(true)
    try {
      await api.post('/admin/v1/retailer-products', {
        retailerId: Number(newRetailerId),
        productId,
        price: newPrice ? Number(newPrice) : undefined,
      })
      setNewRetailerId('')
      setNewPrice('')
      const res = await api.get<ApiResponse<RetailerLink[]>>(`/admin/v1/retailer-products?productId=${productId}`)
      setLinks(res.data.data)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message
      alert(msg ?? '리테일러 연결에 실패했습니다')
    } finally {
      setAddingLink(false)
    }
  }

  async function handleToggleAvailable(link: RetailerLink) {
    try {
      await api.patch(`/admin/v1/retailer-products/${link.id}`, {
        isAvailable: !link.isAvailable,
      })
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isAvailable: !l.isAvailable } : l))
    } catch {
      alert('변경에 실패했습니다')
    }
  }

  async function handleRemoveLink(id: number) {
    if (!confirm('이 리테일러 연결을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/admin/v1/retailer-products/${id}`)
      setLinks(prev => prev.filter(l => l.id !== id))
    } catch {
      alert('삭제에 실패했습니다')
    }
  }

  const linkedRetailerIds = new Set(links.map(l => l.retailerId))
  const availableRetailers = retailers.filter(r => !linkedRetailerIds.has(r.id))

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">불러오는 중...</div>
  if (error || !product) return <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600">{error ?? '상품을 찾을 수 없습니다'}</div>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/products')} className="text-gray-500 hover:text-gray-700 text-sm">
          ← 목록으로
        </button>
        <h1 className="text-2xl font-bold">상품 수정</h1>
      </div>

      {/* 기본 정보 */}
      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">기본 정보</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">상품명 *</label>
            <input name="name" defaultValue={product.name} required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">브랜드</label>
            <select name="brandId" defaultValue={product.brandId ?? ''}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">브랜드 없음</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
            <select name="categoryId" defaultValue={product.categoryId} required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">바코드</label>
            <input name="barcode" defaultValue={product.barcode ?? ''}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select name="status" defaultValue={product.status}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="draft">draft</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">용량 값</label>
            <input name="volumeValue" defaultValue={product.volumeValue ?? ''}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">용량 단위</label>
            <input name="volumeUnit" defaultValue={product.volumeUnit ?? ''} placeholder="g, ml, 개..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">포장 유형</label>
            <input name="packageType" defaultValue={product.packageType ?? ''}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
            <input name="imageUrl" defaultValue={product.imageUrl ?? ''}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea name="description" defaultValue={product.description ?? ''} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.push('/products')}
            className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>

      {/* 리테일러 연결 */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4">리테일러 연결</h2>

        {/* 연결된 리테일러 목록 */}
        {links.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">연결된 리테일러가 없습니다.</p>
        ) : (
          <table className="min-w-full mb-4 text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <th className="px-3 py-2">리테일러</th>
                <th className="px-3 py-2">가격 (원)</th>
                <th className="px-3 py-2">판매중</th>
                <th className="px-3 py-2">신상품</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {links.map(link => (
                <tr key={link.id}>
                  <td className="px-3 py-2 font-medium">{link.retailer.name}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {link.price != null ? link.price.toLocaleString() : '-'}
                    {link.salePrice != null && (
                      <span className="ml-1 text-red-500">→ {link.salePrice.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleToggleAvailable(link)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${link.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {link.isAvailable ? '판매중' : '품절'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    {link.isNew && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">NEW</span>}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleRemoveLink(link.id)}
                      className="text-red-500 hover:text-red-700 text-xs">
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 리테일러 추가 */}
        {availableRetailers.length > 0 && (
          <div className="flex gap-2 items-end border-t pt-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">리테일러</label>
              <select value={newRetailerId} onChange={e => setNewRetailerId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">선택...</option>
                {availableRetailers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1">가격 (원)</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                placeholder="선택 사항"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleAddLink} disabled={!newRetailerId || addingLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
              {addingLink ? '추가 중...' : '추가'}
            </button>
          </div>
        )}

        {availableRetailers.length === 0 && links.length > 0 && (
          <p className="text-xs text-gray-400 border-t pt-3">모든 리테일러가 연결되었습니다.</p>
        )}
      </div>
    </div>
  )
}
