'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = getAccessToken()
    if (!token) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">CartPick Admin</h1>
        </div>
        <nav className="mt-4">
          <a
            href="/"
            className="block px-4 py-2 hover:bg-gray-800"
          >
            Dashboard
          </a>
          <a
            href="/products"
            className="block px-4 py-2 hover:bg-gray-800"
          >
            Products
          </a>
          <a
            href="/brands"
            className="block px-4 py-2 hover:bg-gray-800"
          >
            Brands
          </a>
          <a
            href="/categories"
            className="block px-4 py-2 hover:bg-gray-800"
          >
            Categories
          </a>
          <a
            href="/retailers"
            className="block px-4 py-2 hover:bg-gray-800"
          >
            Retailers
          </a>
          <a
            href="/reports"
            className="block px-4 py-2 hover:bg-gray-800"
          >
            Reports
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold">Dashboard</h2>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}