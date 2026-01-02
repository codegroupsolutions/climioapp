'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'

export default function NewServiceContractPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [formData, setFormData] = useState({
    clientId: '',
    serviceType: 'MAINTENANCE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    serviceFrequency: 'MONTHLY',
    frequencyValue: 1,
    amount: '',
    description: '',
    terms: '',
    notes: '',
    autoRenew: false,
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100')
      const data = await response.json()
      if (response.ok) {
        // Ordenar clientes alfabéticamente por nombre mostrado
        const sortedClients = [...data.clients].sort((a, b) => {
          const nameA = (a.companyName || `${a.firstName} ${a.lastName}`).toLowerCase();
          const nameB = (b.companyName || `${b.firstName} ${b.lastName}`).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setClients(sortedClients)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const getFrequencyLabel = (frequency, value) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/service-contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/dashboard/service-contracts')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear contrato')
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      alert('Error al crear contrato')
    } finally {
      setLoading(false)
    }
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


  const getServiceDescription = (type) => {
    const descriptions = {
      MAINTENANCE: 'Servicio regular de mantenimiento preventivo para equipos de aire acondicionado',
      SUPPORT: 'Soporte técnico y asistencia para resolver problemas',
      FULL_SERVICE: 'Servicio completo que incluye mantenimiento, reparaciones y repuestos',
      INSPECTION: 'Inspección periódica del sistema y diagnóstico de problemas',
      CONSULTATION: 'Consultoría y asesoramiento técnico especializado',
      CUSTOM: 'Servicio personalizado según las necesidades del cliente',
    }
    return descriptions[type] || ''
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Contrato de Servicio</h1>
            <p className="text-gray-600">Registra un nuevo contrato de servicio con un cliente</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                required
              >
                <option value="">Seleccione un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName || `${client.firstName} ${client.lastName}`}
                    {client.phone && ` - ${client.phone}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Servicio *
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) => {
                const type = e.target.value
                setFormData({
                  ...formData,
                  serviceType: type,
                  description: getServiceDescription(type)
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              required
            >
              <option value="MAINTENANCE">Mantenimiento</option>
              <option value="FULL_SERVICE">Servicio Completo</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>

          {/* Service Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia del Servicio *
              </label>
              <select
                value={formData.serviceFrequency}
                onChange={(e) => setFormData({ ...formData, serviceFrequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                required
              >
                <option value="WEEKLY">Semanal</option>
                <option value="BIWEEKLY">Quincenal</option>
                <option value="MONTHLY">Mensual</option>
                <option value="BIMONTHLY">Bimestral</option>
                <option value="QUARTERLY">Trimestral (cada 3 meses)</option>
                <option value="SEMIANNUAL">Semestral (cada 6 meses)</option>
                <option value="ANNUAL">Anual</option>
                <option value="ONE_TIME">Una sola vez</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cada cuántos períodos
              </label>
              <input
                type="number"
                min="1"
                value={formData.frequencyValue}
                onChange={(e) => setFormData({ ...formData, frequencyValue: parseInt(e.target.value) || 1 })}
                disabled={formData.serviceFrequency === 'ONE_TIME'}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
                placeholder="Ej: 2 para cada 2 meses"
              />
              {formData.serviceFrequency !== 'ONE_TIME' && (
                <p className="text-xs text-gray-500 mt-1">
                  Servicio programado: {getFrequencyLabel(formData.serviceFrequency, formData.frequencyValue)}
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio del Servicio *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Fecha del primer servicio programado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin del Contrato (Opcional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dejar vacío para contrato indefinido
              </p>
            </div>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto por Servicio
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Servicio
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe los servicios incluidos en el contrato..."
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Términos y Condiciones
            </label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={3}
              placeholder="Términos específicos del contrato..."
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notas adicionales sobre el contrato..."
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Auto Renew */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRenew"
              checked={formData.autoRenew}
              onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="autoRenew" className="ml-2 text-sm text-gray-700">
              Renovación automática al finalizar el período
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/dashboard/service-contracts"
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}