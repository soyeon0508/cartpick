'use client'

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats cards will be populated in Task 3 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Products</div>
          <div className="text-2xl font-bold mt-2">-</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Reviews</div>
          <div className="text-2xl font-bold mt-2">-</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">New Reviews Today</div>
          <div className="text-2xl font-bold mt-2">-</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Pending Reports</div>
          <div className="text-2xl font-bold mt-2">-</div>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-gray-600">
          Dashboard statistics will be populated in Task 3 after backend API is implemented.
        </p>
      </div>
    </div>
  )
}