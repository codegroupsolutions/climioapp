'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FaArrowLeft, FaEdit, FaTrash, FaBuilding, FaUser, FaCreditCard,
  FaCalendar, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard,
  FaToggleOn, FaToggleOff, FaHistory, FaUsers, FaFileInvoice,
  FaFileAlt, FaChartLine, FaCrown, FaStar, FaGem, FaClock,
  FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa'

export default function CompanyDetailPage({ params }) {
  const router = useRouter()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [companyId, setCompanyId] = useState(null)
  const [deletingUser, setDeletingUser] = useState(false)

  useEffect(() => {
    // Unwrap params promise
    const initializeData = async () => {
      const resolvedParams = await params
      setCompanyId(resolvedParams.id)
    }
    initializeData()
  }, [params])

  useEffect(() => {
    if (companyId) {
      fetchCompany()
    }
  }, [companyId])

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/superadmin/companies/${companyId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al cargar compañía')
      }

      const data = await response.json()
      setCompany(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar esta compañía? Esta acción eliminará permanentemente todos los datos asociados.')) {
      return
    }

    try {
      const response = await fetch(`/api/superadmin/companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        router.push('/superadmin/companies')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar compañía')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar compañía')
    }
  }

  const handleToggleStatus = async () => {
    try {
      const response = await fetch(`/api/superadmin/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !company.active })
      })

      if (response.ok) {
        fetchCompany()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) {
      return
    }

    setDeletingUser(true)
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        fetchCompany()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar usuario')
    } finally {
      setDeletingUser(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      TRIAL: 'bg-blue-100 text-blue-800 border-blue-200',
      SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    const labels = {
      ACTIVE: 'Activo',
      TRIAL: 'Prueba',
      SUSPENDED: 'Suspendido',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado'
    }
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
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

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-red-100 text-red-800 border-red-200',
      USER: 'bg-blue-100 text-blue-800 border-blue-200',
      TECHNICIAN: 'bg-green-100 text-green-800 border-green-200'
    }
    const labels = {
      ADMIN: 'Administrador',
      USER: 'Usuario',
      TECHNICIAN: 'Técnico'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${badges[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
      </span>
    )
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-PR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('es-PR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Compañía no encontrada</p>
        <Link href="/superadmin/companies" className="text-blue-600 hover:underline mt-4 inline-block">
          Volver a Compañías
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/superadmin/companies"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Volver a Compañías
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-gray-600">{company.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {getStatusBadge(company.subscriptionStatus)}
              {company.subscriptionPlan && (
                <div className="flex items-center gap-2">
                  {getPlanIcon(company.subscriptionPlan.type)}
                  <span className="text-sm font-medium">{company.subscriptionPlan.name}</span>
                </div>
              )}
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                  company.active
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {company.active ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                {company.active ? 'Activa' : 'Inactiva'}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/superadmin/companies/${companyId}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaEdit />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FaTrash />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Usuarios</p>
              <p className="text-2xl font-bold">{company._count?.users || 0}</p>
              <p className="text-xs text-gray-500">de {company.maxUsers} máx</p>
            </div>
            <FaUsers className="text-2xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Clientes</p>
              <p className="text-2xl font-bold">{company._count?.clients || 0}</p>
            </div>
            <FaUser className="text-2xl text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Facturas</p>
              <p className="text-2xl font-bold">{company._count?.invoices || 0}</p>
            </div>
            <FaFileInvoice className="text-2xl text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Cotizaciones</p>
              <p className="text-2xl font-bold">{company._count?.quotes || 0}</p>
            </div>
            <FaFileAlt className="text-2xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Citas</p>
              <p className="text-2xl font-bold">{company._count?.appointments || 0}</p>
            </div>
            <FaCalendar className="text-2xl text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['overview', 'users', 'subscription', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' && 'Información General'}
                {tab === 'users' && `Usuarios (${company._count?.users || 0})`}
                {tab === 'subscription' && 'Suscripción'}
                {tab === 'history' && 'Historial'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Información de la Compañía</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <FaBuilding className="text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Nombre</p>
                        <p className="font-medium">{company.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaEnvelope className="text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{company.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaPhone className="text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium">{company.phone || 'No especificado'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaIdCard className="text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">RFC/Tax ID</p>
                        <p className="font-medium">{company.taxId || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Dirección</p>
                        <p className="font-medium">
                          {company.address || 'No especificada'}
                          {company.city && `, ${company.city}`}
                          {company.state && `, ${company.state}`}
                          {company.zipCode && ` ${company.zipCode}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaCalendar className="text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Fecha de Registro</p>
                        <p className="font-medium">{formatDate(company.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaClock className="text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Última Actualización</p>
                        <p className="font-medium">{formatDate(company.updatedAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaCheckCircle className="text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Estado de la Cuenta</p>
                        <p className="font-medium">
                          {company.active ? (
                            <span className="text-green-600">Activa</span>
                          ) : (
                            <span className="text-red-600">Inactiva</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Usuarios de la Compañía</h3>
                <p className="text-sm text-gray-500">
                  {company._count?.users || 0} de {company.maxUsers} usuarios permitidos
                </p>
              </div>

              {company.users && company.users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registro
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {company.users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <FaUser className="text-gray-500 text-sm" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {user.active ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                Activo
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingUser}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Eliminar usuario"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaUsers className="mx-auto text-4xl mb-2 text-gray-300" />
                  <p>No hay usuarios registrados en esta compañía</p>
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Información de Suscripción</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Plan Actual</p>
                        <div className="flex items-center gap-2 mt-1">
                          {company.subscriptionPlan ? (
                            <>
                              {getPlanIcon(company.subscriptionPlan.type)}
                              <span className="font-semibold text-lg">{company.subscriptionPlan.name}</span>
                            </>
                          ) : (
                            <span className="font-semibold text-lg">Plan Gratuito</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Precio Mensual</p>
                        <p className="font-semibold text-lg">
                          {formatCurrency(company.subscriptionPlan?.price || 0)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Estado</p>
                        <div className="mt-1">
                          {getStatusBadge(company.subscriptionStatus)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Usuarios Máximos</p>
                        <p className="font-semibold text-lg">{company.maxUsers}</p>
                        <p className="text-xs text-gray-500">
                          Actualmente usando {company._count?.users || 0} de {company.maxUsers}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Fecha de Inicio</p>
                        <p className="font-medium">{formatDate(company.subscriptionStartDate)}</p>
                      </div>

                      {company.subscriptionEndDate && (
                        <div>
                          <p className="text-sm text-gray-500">Fecha de Vencimiento</p>
                          <p className="font-medium">{formatDate(company.subscriptionEndDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {company.subscriptionPlan?.features && company.subscriptionPlan.features.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-500 mb-3">Características del Plan</p>
                      <ul className="space-y-2">
                        {company.subscriptionPlan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <FaCheckCircle className="text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">Uso de Almacenamiento</p>
                  <p className="text-sm text-gray-500">0 MB / 1 GB</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Historial de Suscripción</h3>
              {company.subscriptionHistories && company.subscriptionHistories.length > 0 ? (
                <div className="space-y-4">
                  {company.subscriptionHistories.map((history) => (
                    <div key={history.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            <FaHistory className="text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {history.action === 'CREATED' && 'Suscripción Creada'}
                              {history.action === 'UPGRADED' && 'Plan Actualizado'}
                              {history.action === 'DOWNGRADED' && 'Plan Degradado'}
                              {history.action === 'CANCELLED' && 'Suscripción Cancelada'}
                              {history.action === 'RENEWED' && 'Suscripción Renovada'}
                              {history.action === 'SUSPENDED' && 'Suscripción Suspendida'}
                              {history.action === 'ACTIVATED' && 'Cuenta Activada'}
                              {history.action === 'CHANGED' && 'Plan Cambiado'}
                            </p>
                            {history.notes && (
                              <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                            )}
                            {(history.oldPlan || history.newPlan) && (
                              <p className="text-sm text-gray-600 mt-1">
                                {history.oldPlan && `De: ${history.oldPlan}`}
                                {history.oldPlan && history.newPlan && ' → '}
                                {history.newPlan && `A: ${history.newPlan}`}
                              </p>
                            )}
                            {history.amount > 0 && (
                              <p className="text-sm font-medium text-gray-700 mt-1">
                                Monto: {formatCurrency(history.amount)}
                              </p>
                            )}
                            {history.user && (
                              <p className="text-xs text-gray-500 mt-2">
                                Por: {history.user.firstName} {history.user.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDateTime(history.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaHistory className="mx-auto text-4xl mb-2 text-gray-300" />
                  <p>No hay historial de suscripción</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}