'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'

export default function EditServiceContractPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contract, setContract] = useState(null)
  const [formData, setFormData] = useState({
    serviceType: '',
    status: '',
    startDate: '',
    endDate: '',
    serviceFrequency: '',
    frequencyValue: 1,
    amount: '',
    description: '',
    terms: '',
    notes: '',
    autoRenew: false,
  })

  useEffect(() => {
    const loadContract = async () => {
      const resolvedParams = await params
      await fetchContract(resolvedParams.id)
    }
    loadContract()
  }, [params])

  const fetchContract = async (id) => {
    try {
      const response = await fetch(`/api/service-contracts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setContract(data)

        // Populate form with contract data
        setFormData({
          serviceType: data.serviceType || '',
          status: data.status || 'ACTIVE',
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
          serviceFrequency: data.serviceFrequency || 'MONTHLY',
          frequencyValue: data.frequencyValue || 1,
          amount: data.amount || '',
          description: data.description || '',
          terms: data.terms || '',
          notes: data.notes || '',
          autoRenew: data.autoRenew || false,
        })
      } else {
        alert('Error al cargar el contrato')
        router.push('/dashboard/service-contracts')
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      alert('Error al cargar el contrato')
      router.push('/dashboard/service-contracts')
    } finally {
      setLoading(false)
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
    setSaving(true)

    const resolvedParams = await params
    try {
      const response = await fetch(`/api/service-contracts/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push(`/dashboard/service-contracts/${resolvedParams.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al actualizar contrato')
      }
    } catch (error) {
      console.error('Error updating contract:', error)
      alert('Error al actualizar contrato')
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Contrato no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/service-contracts/${contract.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Contrato de Servicio</h1>
            <p className="text-gray-600">Contrato #{contract.contractNumber}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Info (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Cliente</h3>
            <p className="text-gray-900 font-medium">
              {contract.client?.companyName || `${contract.client?.firstName} ${contract.client?.lastName}`}
            </p>
            {contract.client?.phone && (
              <p className="text-sm text-gray-600">{contract.client.phone}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado del Contrato *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="ACTIVE">Activo</option>
              <option value="SUSPENDED">Suspendido</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="EXPIRED">Expirado</option>
            </select>
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
                  description: formData.description || getServiceDescription(type)
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Auto Renew */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRenew"
              checked={formData.autoRenew}
              onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRenew" className="ml-2 text-sm text-gray-700">
              Renovación automática al finalizar el período
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Link
              href={`/dashboard/service-contracts/${contract.id}`}
              className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
