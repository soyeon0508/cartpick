'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearTokens } from '@/lib/auth'

const navigation = [
  { name: '대시보드', href: '/', icon: '📊' },
  { name: '상품', href: '/products', icon: '📦' },
  { name: '브랜드', href: '/brands', icon: '🏷️' },
  { name: '카테고리', href: '/categories', icon: '📁' },
  { name: '리테일러', href: '/retailers', icon: '🏪' },
  { name: '신고 관리', href: '/reports', icon: '🚨' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearTokens()
    router.push('/login')
  }

  return (
    <div className="w-56 bg-gray-900 min-h-screen flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-white text-lg font-bold">CartPick Admin</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="mr-2 text-base">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span className="mr-2">🚪</span>
          로그아웃
        </button>
      </div>
    </div>
  )
}
