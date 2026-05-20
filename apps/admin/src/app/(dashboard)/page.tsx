'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface DashboardStats {
  users: {
    total: number
    active: number
    recent: number
  }
  products: {
    total: number
    active: number
  }
  reviews: {
    total: number
    visible: number
    recent: number
  }
  retailers: {
    total: number
  }
  brands: {
    total: number
  }
  categories: {
    total: number
  }
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
      const token = localStorage.getItem('admin_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await api.get<DashboardStats>('/admin/v1/dashboard/statistics', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setStats(response.data)
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
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold mt-2">{stats.users.total}</div>
          <div className="text-xs text-green-600 mt-1">
            {stats.users.recent} new in last 7 days
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Products</div>
          <div className="text-2xl font-bold mt-2">{stats.products.total}</div>
          <div className="text-xs text-blue-600 mt-1">
            {stats.products.active} active
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Reviews</div>
          <div className="text-2xl font-bold mt-2">{stats.reviews.total}</div>
          <div className="text-xs text-purple-600 mt-1">
            {stats.reviews.visible} visible
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Retailers</div>
          <div className="text-2xl font-bold mt-2">{stats.retailers.total}</div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.brands.total} brands, {stats.categories.total} categories
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New users (7 days)</span>
              <span className="font-semibold">{stats.users.recent}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New reviews (7 days)</span>
              <span className="font-semibold">{stats.reviews.recent}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active users</span>
              <span className="font-semibold">{stats.users.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active products</span>
              <span className="font-semibold">{stats.products.active}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/products')}
              className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-blue-900">Manage Products</div>
              <div className="text-sm text-blue-600">View and manage all products</div>
            </button>
            <button
              onClick={() => router.push('/dashboard/reviews')}
              className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-purple-900">Manage Reviews</div>
              <div className="text-sm text-purple-600">Moderate and manage reviews</div>
            </button>
            <button
              onClick={() => router.push('/dashboard/brands')}
              className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-green-900">Manage Brands</div>
              <div className="text-sm text-green-600">Manage brand information</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}