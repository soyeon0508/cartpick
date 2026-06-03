'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Report {
  id: number
  reason: string
  status: string
  createdAt: string
  review: { id: number; body: string; moderationStatus: string }
  reporter: { id: number; nickname: string }
  resolver?: { id: number; name: string } | null
}

interface ApiResponse {
  success: boolean
  data: { items: Report[]; totalCount: number }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchReports()
  }, [statusFilter, offset])

  async function fetchReports() {
    setLoading(true)
    try {
      const params: Record<string, any> = { limit, offset }
      if (statusFilter) params.status = statusFilter
      const res = await api.get<ApiResponse>('/admin/v1/reports', { params })
      setReports(res.data.data.items)
      setTotalCount(res.data.data.totalCount)
    } catch {
      setError('신고 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: number, action: 'resolve' | 'dismiss') {
    try {
      await api.patch(`/admin/v1/reports/${id}`, { action })
      fetchReports()
    } catch {
      alert('처리에 실패했습니다')
    }
  }

  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(totalCount / limit)

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      dismissed: 'bg-gray-100 text-gray-600',
    }
    return map[status] ?? 'bg-gray-100 text-gray-600'
  }

  const statusLabel: Record<string, string> = {
    pending: '대기',
    resolved: '처리됨',
    dismissed: '무시됨',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          신고 관리 {totalCount > 0 && <span className="text-base font-normal text-gray-500">({totalCount}개)</span>}
        </h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setOffset(0) }}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">전체</option>
          <option value="pending">대기</option>
          <option value="resolved">처리됨</option>
          <option value="dismissed">무시됨</option>
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">신고자</th>
              <th className="px-4 py-3">사유</th>
              <th className="px-4 py-3">리뷰 내용</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">날짜</th>
              <th className="px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">신고 내역이 없습니다</td></tr>
            ) : reports.map(report => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{report.reporter.nickname}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[120px] truncate">{report.reason}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{report.review.body}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(report.status)}`}>
                    {statusLabel[report.status] ?? report.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(report.id, 'resolve')}
                        className="text-green-600 hover:text-green-800 text-xs underline"
                      >
                        처리
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'dismiss')}
                        className="text-gray-500 hover:text-gray-800 text-xs underline"
                      >
                        무시
                      </button>
                    </>
                  )}
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
