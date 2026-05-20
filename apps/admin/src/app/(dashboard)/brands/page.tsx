'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Brand {
  id: number
  name: string
  description?: string
  logoUrl?: string
  country?: { id: number; name: string }
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
  })

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await api.get<{ data: Brand[] }>('/admin/v1/brands', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBrands(response.data.data)
    } catch (err: any) {
      setError('Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      await api.post('/admin/v1/brands', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowModal(false)
      setFormData({ name: '', description: '', logoUrl: '' })
      fetchBrands()
    } catch (err) {
      alert('Failed to create brand')
    }
  }

  const handleUpdate = async () => {
    if (!editingBrand) return
    try {
      const token = localStorage.getItem('admin_token')
      await api.patch(`/admin/v1/brands/${editingBrand.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowModal(false)
      setEditingBrand(null)
      setFormData({ name: '', description: '', logoUrl: '' })
      fetchBrands()
    } catch (err) {
      alert('Failed to update brand')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this brand?')) return
    try {
      const token = localStorage.getItem('admin_token')
      await api.delete(`/admin/v1/brands/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchBrands()
    } catch (err) {
      alert('Failed to delete brand')
    }
  }

  const openModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({
        name: brand.name,
        description: brand.description || '',
        logoUrl: brand.logoUrl || '',
      })
    } else {
      setEditingBrand(null)
      setFormData({ name: '', description: '', logoUrl: '' })
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
        <h1 className="text-2xl font-bold">Brands</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Brand
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {brand.logoUrl && (
                        <img className="h-10 w-10 rounded" src={brand.logoUrl} alt="" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {brand.country?.name || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {brand.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openModal(brand)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
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
              {editingBrand ? 'Edit Brand' : 'Add Brand'}
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
                  setEditingBrand(null)
                  setFormData({ name: '', description: '', logoUrl: '' })
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={editingBrand ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingBrand ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}