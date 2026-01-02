'use client'

import { useState, useEffect } from 'react'
import { FaCreditCard, FaPlus, FaEdit, FaTrash, FaCrown, FaStar, FaGem, FaToggleOn, FaToggleOff } from 'react-icons/fa'

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'FREE',
    description: '',
    price: 0,
    maxUsers: 2,
    features: []
  })
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/subscription-plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const method = editingPlan ? 'PUT' : 'POST'
    const body = editingPlan ? { ...formData, id: editingPlan.id } : formData

    try {
      const response = await fetch('/api/superadmin/subscription-plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setShowModal(false)
        resetForm()
        fetchPlans()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('Error al guardar plan')
    }
  }

  const handleEdit = (plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      type: plan.type,
      description: plan.description || '',
      price: plan.price,
      maxUsers: plan.maxUsers,
      features: plan.features || []
    })
    setShowModal(true)
  }

  const togglePlanStatus = async (plan) => {
    try {
      const response = await fetch('/api/superadmin/subscription-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, isActive: !plan.isActive })
      })

      if (response.ok) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Error updating plan:', error)
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      })
      setNewFeature('')
    }
  }

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    })
  }

  const resetForm = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      type: 'FREE',
      description: '',
      price: 0,
      maxUsers: 2,
      features: []
    })
    setNewFeature('')
  }

  const getPlanIcon = (type) => {
    switch(type) {
      case 'FREE':
        return <FaStar className="text-3xl text-gray-500" />
      case 'STANDARD':
        return <FaStar className="text-3xl text-blue-500" />
      case 'PREMIUM':
        return <FaGem className="text-3xl text-purple-500" />
      case 'ENTERPRISE':
        return <FaCrown className="text-3xl text-yellow-500" />
      default:
        return <FaStar className="text-3xl text-gray-400" />
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Default plans configuration
  const defaultPlans = [
    { type: 'FREE', name: 'Gratis', maxUsers: 2, price: 0 },
    { type: 'STANDARD', name: 'Estándar', maxUsers: 5, price: 299 },
    { type: 'PREMIUM', name: 'Premium', maxUsers: 15, price: 599 },
    { type: 'ENTERPRISE', name: 'Enterprise', maxUsers: 999, price: 999 }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes de Suscripción</h1>
          <p className="text-gray-600">Configura los planes y precios del sistema</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          Nuevo Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-flex items-center">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
              Cargando...
            </div>
          </div>
        ) : plans.length === 0 ? (
          <>
            {defaultPlans.map((plan) => (
              <div key={plan.type} className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
                <div className="text-center">
                  {getPlanIcon(plan.type)}
                  <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mt-2">Plan sugerido</p>
                  <p className="text-3xl font-bold mt-4">{formatCurrency(plan.price)}</p>
                  <p className="text-gray-500">/ mes</p>
                  <p className="text-sm mt-4">Hasta {plan.maxUsers} usuarios</p>
                  <button
                    onClick={() => {
                      setFormData({
                        ...plan,
                        description: `Plan ${plan.name} con hasta ${plan.maxUsers} usuarios`,
                        features: []
                      })
                      setShowModal(true)
                    }}
                    className="mt-6 w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    Crear Este Plan
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-lg shadow p-6 ${!plan.isActive ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                {getPlanIcon(plan.type)}
                <button
                  onClick={() => togglePlanStatus(plan)}
                  className="text-2xl"
                  title={plan.isActive ? 'Desactivar' : 'Activar'}
                >
                  {plan.isActive ? (
                    <FaToggleOn className="text-green-500" />
                  ) : (
                    <FaToggleOff className="text-gray-400" />
                  )}
                </button>
              </div>

              <h3 className="text-xl font-bold">{plan.name}</h3>
              {plan.description && (
                <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
              )}

              <div className="mt-4">
                <p className="text-3xl font-bold">{formatCurrency(plan.price)}</p>
                <p className="text-gray-500">/ mes</p>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Características:</p>
                <ul className="space-y-1">
                  <li className="text-sm text-gray-600 flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Hasta {plan.maxUsers} usuarios
                  </li>
                  {plan.features && plan.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {plan._count && (
                <p className="text-sm text-gray-500 mt-4">
                  {plan._count.companies} compañías usando este plan
                </p>
              )}

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <FaEdit className="inline mr-1" />
                  Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan de Suscripción'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Plan *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      required
                    >
                      <option value="FREE">Gratis</option>
                      <option value="STANDARD">Estándar</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo de Usuarios *
                    </label>
                    <input
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({...formData, maxUsers: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Características del Plan
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      placeholder="Agregar característica..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Agregar
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {formData.features.map((feature, index) => (
                      <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    {editingPlan ? 'Actualizar' : 'Crear'} Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}