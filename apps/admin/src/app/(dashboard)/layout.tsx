'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import { getAccessToken, authStorage, setAccessToken } from '@/lib/auth'
import api from '@/lib/api'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // accessToken이 메모리에 있으면 바로 통과
    if (getAccessToken()) {
      setReady(true)
      return
    }

    // 없으면 refreshToken으로 복구 시도
    const refreshToken = authStorage.getRefreshToken()
    if (!refreshToken) {
      router.replace('/login')
      return
    }

    api.post('/admin/v1/auth/refresh', { refreshToken })
      .then((res) => {
        setAccessToken(res.data.data.tokens.accessToken)
        authStorage.setRefreshToken(res.data.data.tokens.refreshToken)
        setReady(true)
      })
      .catch(() => {
        authStorage.removeRefreshToken()
        router.replace('/login')
      })
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
