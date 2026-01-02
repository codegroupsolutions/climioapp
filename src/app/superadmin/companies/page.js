'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaBuilding, FaUsers, FaEdit, FaTrash, FaEye, FaPlus, FaCrown, FaStar, FaGem, FaSearch } from 'react-icons/fa'

export default function CompaniesManagementPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchCompanies()
  }, [searchTerm, filterStatus, filterPlan])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterPlan && { planType: filterPlan }),
      })

      const response = await fetch(`/api/superadmin/companies?${params}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta compañía? Se eliminarán todos los datos asociados.')) return

    try {
      const response = await fetch(`/api/superadmin/companies/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        fetchCompanies()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar compañía')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Error al eliminar compañía')
    }
  }

  const toggleCompanyStatus = async (company) => {
    try {
      const response = await fetch(`/api/superadmin/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !company.active })
      })

      if (response.ok) {
        fetchCompanies()
      }
    } catch (error) {
      console.error('Error updating company:', error)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800',
      TRIAL: 'bg-blue-100 text-blue-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      ACTIVE: 'Activo',
      TRIAL: 'Prueba',
      SUSPENDED: 'Suspendido',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getPlanIcon = (type) => {
    switch(type) {
      case 'FREE':
        return <FaStar className="text-gray-500" />
      case 'STANDARD':
        return <FaStar className="text-blue-500" />
      case 'PREMIUM':
        return <FaGem className="text-purple-500" />
      case 'ENTERPRISE':
        return <FaCrown className="text-yellow-500" />
      default:
        return <FaStar className="text-gray-400" />
    }
  }

  const getPlanLabel = (plan) => {
    if (!plan) return 'Gratis'
    const labels = {
      FREE: 'Gratis',
      STANDARD: 'Estándar',
      PREMIUM: 'Premium',
      ENTERPRISE: 'Enterprise'
    }
    return labels[plan.type] || plan.name
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-PR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Compañías</h1>
          <p className="text-gray-600">Administra todas las compañías del sistema</p>
        </div>
        <Link
          href="/superadmin/companies/new"
          className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          Nueva Compañía
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar compañía..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="TRIAL">Prueba</option>
            <option value="SUSPENDED">Suspendido</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="EXPIRED">Expirado</option>
          </select>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="">Todos los planes</option>
            <option value="FREE">Gratis</option>
            <option value="STANDARD">Estándar</option>
            <option value="PREMIUM">Premium</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('')
              setFilterPlan('')
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compañía
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creación
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="inline-flex items-center">
                      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron compañías
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center">
                          <FaBuilding className="text-gray-400 mr-2" />
                          <div>
                            <p className="font-medium text-gray-900">{company.name}</p>
                            <p className="text-sm text-gray-500">{company.email}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {company.subscriptionPlan && getPlanIcon(company.subscriptionPlan.type)}
                        <span className="text-sm">
                          {getPlanLabel(company.subscriptionPlan)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <FaUsers className="text-gray-400 mr-1" />
                        <span className="font-medium">{company._count?.users || 0}</span>
                        <span className="text-gray-500 ml-1">/ {company.maxUsers}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(company.subscriptionStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(company.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleCompanyStatus(company)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          company.active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            company.active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/superadmin/companies/${company.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalles"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => router.push(`/superadmin/companies/${company.id}/edit`)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}