'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface DashboardStats {
  totalProducts: number
  totalReviews: number
  newReviewsToday: number
  pendingReports: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get<{ success: boolean; data: DashboardStats }>('/admin/v1/dashboard')
      setStats(response.data.data)
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login')
      } else {
        setError('Failed to load dashboard statistics')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error || 'Failed to load dashboard'}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">전체 상품</div>
          <div className="text-2xl font-bold mt-2">{stats.totalProducts}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">전체 리뷰</div>
          <div className="text-2xl font-bold mt-2">{stats.totalReviews}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">오늘 새 리뷰</div>
          <div className="text-2xl font-bold mt-2">{stats.newReviewsToday}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">처리 대기 신고</div>
          <div className="text-2xl font-bold mt-2 text-red-600">{stats.pendingReports}</div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">빠른 이동</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '상품 관리', href: '/products', color: 'bg-blue-50 text-blue-900' },
            { label: '브랜드 관리', href: '/brands', color: 'bg-green-50 text-green-900' },
            { label: '카테고리 관리', href: '/categories', color: 'bg-yellow-50 text-yellow-900' },
            { label: '신고 관리', href: '/reports', color: 'bg-red-50 text-red-900' },
          ].map(({ label, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`px-4 py-3 rounded-lg text-left font-medium ${color} hover:opacity-80 transition-opacity`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}