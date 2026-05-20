import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  
  if (!token) {
    redirect('/login')
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