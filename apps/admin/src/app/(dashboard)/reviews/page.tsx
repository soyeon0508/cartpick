'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Review {
  id: number
  rating: number
  title: string
  content: string
  moderationStatus: 'visible' | 'hidden' | 'pending'
  createdAt: string
  user: { id: number; nickname: string; profileImage?: string }
  product: { id: number; name: string; imageUrl?: string }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    fetchReviews()
  }, [page, statusFilter])

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const params: any = { page, limit: 10 }
      if (statusFilter) params.moderationStatus = statusFilter

      const response = await api.get<{ data: Review[]; meta: { totalPages: number } }>(
        '/admin/v1/products', // This would typically be /admin/v1/reviews
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      )
      setReviews(response.data.data)
      setTotalPages(response.data.meta.totalPages)
    } catch (err: any) {
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: number, status: 'visible' | 'hidden') => {
    try {
      const token = localStorage.getItem('admin_token')
      await api.patch(`/admin/v1/reviews/${id}`, 
        { moderationStatus: status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchReviews()
    } catch (err) {
      alert('Failed to update review status')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      visible: 'bg-green-100 text-green-800',
      hidden: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>
        {status}
      </span>
    )
  }

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (error) {
    return <div className="bg-red-50 p-4 rounded-lg">{error}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-4">
                {review.user.profileImage && (
                  <img
                    src={review.user.profileImage}
                    alt={review.user.nickname}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium">{review.user.nickname}</div>
                  <div className="text-sm text-gray-500">{renderStars(review.rating)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {getStatusBadge(review.moderationStatus)}
                <div className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="mb-2">
              <h3 className="font-semibold text-lg">{review.title}</h3>
            </div>
            <p className="text-gray-700 mb-4">{review.content}</p>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Product:</span>
              <span className="font-medium">{review.product.name}</span>
            </div>

            <div className="mt-4 flex gap-2">
              {review.moderationStatus === 'pending' || review.moderationStatus === 'hidden' ? (
                <button
                  onClick={() => handleStatusChange(review.id, 'visible')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              ) : null}
              {review.moderationStatus === 'visible' || review.moderationStatus === 'pending' ? (
                <button
                  onClick={() => handleStatusChange(review.id, 'hidden')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Hide
                </button>
              ) : null}
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}