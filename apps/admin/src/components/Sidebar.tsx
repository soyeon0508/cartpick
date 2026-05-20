'use client'

import { usePathname, useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Products', href: '/dashboard/products', icon: '📦' },
  { name: 'Reviews', href: '/dashboard/reviews', icon: '⭐' },
  { name: 'Brands', href: '/dashboard/brands', icon: '🏷️' },
  { name: 'Categories', href: '/dashboard/categories', icon: '📁' },
  { name: 'Retailers', href: '/dashboard/retailers', icon: '🏪' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-white text-xl font-bold">CartPick Admin</h1>
      </div>
      
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </a>
          )
        })}
      </nav>
      
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <span className="mr-3">🚪</span>
          Logout
        </button>
      </div>
    </div>
  )
}