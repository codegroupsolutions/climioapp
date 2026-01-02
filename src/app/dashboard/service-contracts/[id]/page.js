'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaEdit, FaTrash, FaCalendarPlus, FaHistory, FaClock, FaCheckCircle, FaUser, FaFileContract, FaCalendarAlt } from 'react-icons/fa'

export default function ServiceContractDetailPage({ params }) {
  const router = useRouter()
  const [contract, setContract] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleData, setScheduleData] = useState({
    startDate: '',
    endDate: '',
    technicianId: '',
    description: '',
    notes: ''
  })
  const [scheduleLoading, setScheduleLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      await Promise.all([
        fetchContract(resolvedParams.id),
        fetchAppointments(resolvedParams.id),
        fetchTechnicians()
      ])
    }
    loadData()
  }, [params])

  const fetchContract = async (id) => {
    try {
      const response = await fetch(`/api/service-contracts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setContract(data)

        // Set default schedule date based on nextServiceDate
        if (data.nextServiceDate) {
          const nextDate = new Date(data.nextServiceDate)
          setScheduleData(prev => ({
            ...prev,
            startDate: nextDate.toISOString().slice(0, 16),
            endDate: new Date(nextDate.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async (contractId) => {
    try {
      const response = await fetch(`/api/service-contracts/${contractId}/appointments`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setTechnicians(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching technicians:', error)
    }
  }

  const handleScheduleService = async (e) => {
    e.preventDefault()
    setScheduleLoading(true)

    const resolvedParams = await params
    try {
      const response = await fetch(`/api/service-contracts/${resolvedParams.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      })

      if (response.ok) {
        setShowScheduleModal(false)
        await Promise.all([
          fetchContract(resolvedParams.id),
          fetchAppointments(resolvedParams.id)
        ])
        alert('Servicio programado exitosamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al programar servicio')
      }
    } catch (error) {
      console.error('Error scheduling service:', error)
      alert('Error al programar servicio')
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar este contrato?')) return

    const resolvedParams = await params
    try {
      const response = await fetch(`/api/service-contracts/${resolvedParams.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/service-contracts')
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
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
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

  const getFrequencyLabel = (frequency, value = 1) => {
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
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (date) => {
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
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Contrato no encontrado</p>
        <Link href="/dashboard/service-contracts" className="text-blue-600 hover:underline mt-4 inline-block">
          Volver a contratos
        </Link>
      </div>
    )
  }

  const hasPendingAppointment = appointments.some(apt => apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS')
  const isServiceDue = contract.nextServiceDate && new Date(contract.nextServiceDate) <= new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/service-contracts"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaArrowLeft />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Contrato {contract.contractNumber}
              </h1>
              {getStatusBadge(contract.status)}
            </div>
            <p className="text-gray-600">
              {contract.client.companyName || `${contract.client.firstName} ${contract.client.lastName}`}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {contract.status === 'ACTIVE' && !hasPendingAppointment && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className={`px-4 py-2 ${isServiceDue ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors flex items-center gap-2`}
            >
              <FaCalendarPlus />
              {isServiceDue ? 'Programar Servicio Vencido' : 'Programar Servicio'}
            </button>
          )}
          <button
            onClick={() => router.push(`/dashboard/service-contracts/${contract.id}/edit`)}
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <FaEdit />
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <FaTrash />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaFileContract className="mr-2" />
              Detalles del Contrato
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipo de Servicio</dt>
                <dd className="mt-1 text-sm text-gray-900">{getServiceTypeLabel(contract.serviceType)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Frecuencia</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getFrequencyLabel(contract.serviceFrequency, contract.frequencyValue)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Inicio</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(contract.startDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Fin</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contract.endDate ? formatDate(contract.endDate) : 'Indefinido'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Monto por Servicio</dt>
                <dd className="mt-1 text-sm text-gray-900 font-semibold">{formatCurrency(contract.amount)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Renovación Automática</dt>
                <dd className="mt-1 text-sm text-gray-900">{contract.autoRenew ? 'Sí' : 'No'}</dd>
              </div>
            </dl>
            {contract.description && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="mt-1 text-sm text-gray-900">{contract.description}</dd>
              </div>
            )}
            {contract.notes && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">Notas</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-yellow-50 p-3 rounded">{contract.notes}</dd>
              </div>
            )}
          </div>

          {/* Service Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaClock className="mr-2" />
              Estado del Servicio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${contract.lastServiceDate ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <dt className="text-sm font-medium text-gray-600">Último Servicio</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {contract.lastServiceDate ? formatDate(contract.lastServiceDate) : 'Sin servicios registrados'}
                </dd>
              </div>
              <div className={`p-4 rounded-lg ${isServiceDue ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                <dt className="text-sm font-medium text-gray-600">Próximo Servicio</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {contract.nextServiceDate ? (
                    <>
                      {formatDate(contract.nextServiceDate)}
                      {isServiceDue && (
                        <span className="block text-sm text-red-600 mt-1">⚠️ Servicio vencido</span>
                      )}
                    </>
                  ) : 'No programado'}
                </dd>
              </div>
            </div>
            {hasPendingAppointment && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⏳ Hay una cita pendiente programada para este contrato
                </p>
              </div>
            )}
          </div>

          {/* Service History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaHistory className="mr-2" />
              Historial de Servicios
            </h2>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay servicios registrados</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{appointment.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status === 'COMPLETED' ? 'Completado' :
                             appointment.status === 'IN_PROGRESS' ? 'En Progreso' :
                             appointment.status === 'CANCELLED' ? 'Cancelado' : 'Programado'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <FaCalendarAlt className="inline mr-1" />
                          {formatDateTime(appointment.startDate)}
                        </p>
                        {appointment.technician && (
                          <p className="text-sm text-gray-600">
                            <FaUser className="inline mr-1" />
                            {appointment.technician.firstName} {appointment.technician.lastName}
                          </p>
                        )}
                        {appointment.notes && (
                          <p className="text-sm text-gray-500 mt-2">{appointment.notes}</p>
                        )}
                      </div>
                      <Link
                        href={`/dashboard/appointments/${appointment.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ver detalles →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Información del Cliente</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">
                  {contract.client.companyName || `${contract.client.firstName} ${contract.client.lastName}`}
                </p>
              </div>
              {contract.client.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{contract.client.email}</p>
                </div>
              )}
              {contract.client.phone && (
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p>{contract.client.phone}</p>
                </div>
              )}
              {contract.client.address && (
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p>{contract.client.address}</p>
                </div>
              )}
              <Link
                href={`/dashboard/clients/${contract.client.id}`}
                className="inline-block mt-4 text-blue-600 hover:underline text-sm"
              >
                Ver perfil completo →
              </Link>
            </div>
          </div>

          {/* Contract Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Resumen del Contrato</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total de Servicios</span>
                <span className="font-medium">{appointments.filter(a => a.status === 'COMPLETED').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Servicios Pendientes</span>
                <span className="font-medium">{appointments.filter(a => a.status === 'SCHEDULED').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Creado por</span>
                <span className="font-medium">{contract.user.firstName} {contract.user.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Fecha de Creación</span>
                <span className="font-medium">{formatDate(contract.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Service Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Programar Servicio</h2>
            <form onSubmit={handleScheduleService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  value={scheduleData.startDate}
                  onChange={(e) => setScheduleData({...scheduleData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                  required
                />
                {contract.nextServiceDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha sugerida según frecuencia: {formatDate(contract.nextServiceDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora de Fin *
                </label>
                <input
                  type="datetime-local"
                  value={scheduleData.endDate}
                  onChange={(e) => setScheduleData({...scheduleData, endDate: e.target.value})}
                  min={scheduleData.startDate}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Técnico Asignado *
                </label>
                <select
                  value={scheduleData.technicianId}
                  onChange={(e) => setScheduleData({...scheduleData, technicianId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                  required
                >
                  <option value="">Seleccione un técnico</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Servicio
                </label>
                <textarea
                  value={scheduleData.description}
                  onChange={(e) => setScheduleData({...scheduleData, description: e.target.value})}
                  rows={2}
                  placeholder="Detalles específicos del servicio a realizar..."
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Internas
                </label>
                <textarea
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({...scheduleData, notes: e.target.value})}
                  rows={2}
                  placeholder="Notas para el técnico..."
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={scheduleLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                  disabled={scheduleLoading}
                >
                  {scheduleLoading ? 'Programando...' : 'Programar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}