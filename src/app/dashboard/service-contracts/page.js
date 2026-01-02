'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaFileContract, FaPlus, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaClock } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

export default function ServiceContractsPage() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterServiceType, setFilterServiceType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()

  useEffect(() => {
    fetchContracts()
  }, [currentPage, searchTerm, filterStatus, filterServiceType])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterServiceType && { serviceType: filterServiceType }),
      })

      const response = await fetch(`/api/service-contracts?${params}`)
      const data = await response.json()

      if (response.ok) {
        setContracts(data.contracts)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este contrato?')) return

    try {
      const response = await fetch(`/api/service-contracts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchContracts()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar contrato')
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
      alert('Error al eliminar contrato')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      ACTIVE: 'Activo',
      EXPIRED: 'Expirado',
      CANCELLED: 'Cancelado',
      SUSPENDED: 'Suspendido',
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getServiceTypeLabel = (type) => {
    const labels = {
      MAINTENANCE: 'Mantenimiento',
      SUPPORT: 'Soporte',
      FULL_SERVICE: 'Servicio Completo',
      INSPECTION: 'Inspección',
      CONSULTATION: 'Consultoría',
      CUSTOM: 'Personalizado',
    }
    return labels[type] || type
  }

  const getServiceFrequencyLabel = (frequency, value = 1) => {
    const labels = {
      WEEKLY: value > 1 ? `Cada ${value} semanas` : 'Semanal',
      BIWEEKLY: 'Quincenal',
      MONTHLY: value > 1 ? `Cada ${value} meses` : 'Mensual',
      BIMONTHLY: 'Bimestral',
      QUARTERLY: 'Trimestral',
      SEMIANNUAL: 'Semestral',
      ANNUAL: value > 1 ? `Cada ${value} años` : 'Anual',
      ONE_TIME: 'Una sola vez',
    }
    return labels[frequency] || frequency
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-PR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const isExpiringSoon = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos de Servicio</h1>
          <p className="text-gray-600">Gestiona los contratos de servicio con tus clientes</p>
        </div>
        <Link
          href="/dashboard/service-contracts/new"
          className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          Nuevo Contrato
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar por cliente o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="EXPIRED">Expirado</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="SUSPENDED">Suspendido</option>
            </select>
          </div>
          <div>
            <select
              value={filterServiceType}
              onChange={(e) => setFilterServiceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            >
              <option value="">Todos los tipos</option>
              <option value="MAINTENANCE">Mantenimiento</option>
              <option value="SUPPORT">Soporte</option>
              <option value="FULL_SERVICE">Servicio Completo</option>
              <option value="INSPECTION">Inspección</option>
              <option value="CONSULTATION">Consultoría</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('')
                setFilterServiceType('')
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Servicio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frecuencia del Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próximo Servicio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="inline-flex items-center">
                      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron contratos
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaFileContract className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {contract.contractNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contract.client.companyName || `${contract.client.firstName} ${contract.client.lastName}`}
                        </div>
                        {contract.client.phone && (
                          <div className="text-xs text-gray-500">{contract.client.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getServiceTypeLabel(contract.serviceType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(contract.status)}
                      {isExpiringSoon(contract.endDate) && (
                        <div className="mt-1">
                          <span className="text-xs text-orange-600 flex items-center justify-center">
                            <FaClock className="mr-1" />
                            Por expirar
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getServiceFrequencyLabel(contract.serviceFrequency, contract.frequencyValue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contract.nextServiceDate ? (
                          <div>
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-gray-400 mr-1" />
                              {formatDate(contract.nextServiceDate)}
                            </div>
                            {new Date(contract.nextServiceDate) < new Date() && (
                              <span className="text-xs text-red-600">Vencido</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(contract.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/dashboard/service-contracts/${contract.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalles"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/service-contracts/${contract.id}/edit`)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(contract.id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}