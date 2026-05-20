'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Retailer {
  id: number
  name: string
  description?: string
  websiteUrl?: string
  logoUrl?: string
  country?: { id: number; name: string }
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    logoUrl: '',
  })

  useEffect(() => {
    fetchRetailers()
  }, [])

  const fetchRetailers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await api.get<{ data: Retailer[] }>('/admin/v1/retailers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRetailers(response.data.data)
    } catch (err: any) {
      setError('Failed to load retailers')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      await api.post('/admin/v1/retailers', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowModal(false)
      setFormData({ name: '', description: '', websiteUrl: '', logoUrl: '' })
      fetchRetailers()
    } catch (err) {
      alert('Failed to create retailer')
    }
  }

  const handleUpdate = async () => {
    if (!editingRetailer) return
    try {
      const token = localStorage.getItem('admin_token')
      await api.patch(`/admin/v1/retailers/${editingRetailer.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowModal(false)
      setEditingRetailer(null)
      setFormData({ name: '', description: '', websiteUrl: '', logoUrl: '' })
      fetchRetailers()
    } catch (err) {
      alert('Failed to update retailer')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this retailer?')) return
    try {
      const token = localStorage.getItem('admin_token')
      await api.delete(`/admin/v1/retailers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchRetailers()
    } catch (err) {
      alert('Failed to delete retailer')
    }
  }

  const openModal = (retailer?: Retailer) => {
    if (retailer) {
      setEditingRetailer(retailer)
      setFormData({
        name: retailer.name,
        description: retailer.description || '',
        websiteUrl: retailer.websiteUrl || '',
        logoUrl: retailer.logoUrl || '',
      })
    } else {
      setEditingRetailer(null)
      setFormData({ name: '', description: '', websiteUrl: '', logoUrl: '' })
    }
    setShowModal(true)
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
        <h1 className="text-2xl font-bold">Retailers</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Retailer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Retailer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {retailers.map((retailer) => (
              <tr key={retailer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {retailer.logoUrl && (
                        <img className="h-10 w-10 rounded" src={retailer.logoUrl} alt="" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{retailer.name}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {retailer.description || '-'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {retailer.country?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {retailer.websiteUrl ? (
                    <a
                      href={retailer.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Visit Website
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openModal(retailer)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(retailer.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingRetailer ? 'Edit Retailer' : 'Add Retailer'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingRetailer(null)
                  setFormData({ name: '', description: '', websiteUrl: '', logoUrl: '' })
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={editingRetailer ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingRetailer ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}