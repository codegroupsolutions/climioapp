'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaSave, FaBuilding, FaUser, FaCreditCard, FaToggleOn, FaToggleOff } from 'react-icons/fa'

export default function EditCompany({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [plans, setPlans] = useState([])
  const [companyId, setCompanyId] = useState(null)

  const [formData, setFormData] = useState({
    // Company data
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    taxId: '',
    active: true,
    // Subscription data
    subscriptionPlanId: '',
    subscriptionStatus: 'TRIAL',
    maxUsers: 2
  })

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
      fetchPlans()
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
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        taxId: data.taxId || '',
        active: data.active,
        subscriptionPlanId: data.subscriptionPlanId || '',
        subscriptionStatus: data.subscriptionStatus || 'TRIAL',
        maxUsers: data.maxUsers || 2
      })
    } catch (error) {
      console.error('Error:', error)
      setError('Error al cargar los datos de la compañía')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/superadmin/subscription-plans', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPlans(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Update max users based on selected plan
    if (name === 'subscriptionPlanId') {
      const selectedPlan = plans.find(p => p.id === value)
      if (selectedPlan) {
        setFormData(prev => ({
          ...prev,
          maxUsers: selectedPlan.maxUsers,
          subscriptionStatus: value ? 'ACTIVE' : 'TRIAL'
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          maxUsers: 2,
          subscriptionStatus: 'TRIAL'
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/superadmin/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar compañía')
      }

      setSuccess('Compañía actualizada exitosamente')
      setTimeout(() => {
        router.push('/superadmin/companies')
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      setError(error.message || 'Error al actualizar la compañía')
    } finally {
      setSaving(false)
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
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
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
        <h1 className="text-2xl font-bold text-gray-900">Editar Compañía</h1>
        <p className="text-gray-600 mt-1">Actualiza la información de la compañía y su suscripción</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <FaBuilding className="text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold">Información de la Compañía</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Compañía *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Corporativo *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFC/Tax ID
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código Postal
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de la Cuenta
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.active
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {formData.active ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
                {formData.active ? 'Activa' : 'Inactiva'}
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <FaCreditCard className="text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold">Información de Suscripción</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan de Suscripción
              </label>
              <select
                name="subscriptionPlanId"
                value={formData.subscriptionPlanId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Plan Gratuito (2 usuarios)</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price}/mes ({plan.maxUsers} usuarios)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Suscripción
              </label>
              <select
                name="subscriptionStatus"
                value={formData.subscriptionStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TRIAL">Prueba</option>
                <option value="ACTIVE">Activa</option>
                <option value="SUSPENDED">Suspendida</option>
                <option value="CANCELLED">Cancelada</option>
                <option value="EXPIRED">Expirada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuarios Máximos
              </label>
              <input
                type="number"
                name="maxUsers"
                value={formData.maxUsers}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este valor se actualiza automáticamente según el plan seleccionado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Actual
              </label>
              <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusBadge(formData.subscriptionStatus)}`}>
                {formData.subscriptionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-end gap-4">
            <Link
              href="/superadmin/companies"
              className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
            >
              <FaSave />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}