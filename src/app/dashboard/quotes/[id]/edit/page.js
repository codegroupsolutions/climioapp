'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditQuotePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    clientId: '',
    validUntil: '',
    notes: '',
    discount: 0,
    taxRate: 16,
  })

  const [items, setItems] = useState([])

  useEffect(() => {
    fetchQuote()
    fetchClients()
    fetchProducts()
    fetchCompanySettings()
  }, [params.id])

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        // Check if quote can be edited
        if (data.status === 'ACCEPTED' || data.status === 'REJECTED') {
          alert('No se puede editar una cotización aceptada o rechazada')
          router.push(`/dashboard/quotes/${params.id}`)
          return
        }

        setFormData({
          clientId: data.clientId,
          validUntil: data.validUntil ? data.validUntil.split('T')[0] : '',
          notes: data.notes || '',
          discount: ((data.discount / data.subtotal) * 100) || 0,
          taxRate: ((data.tax / (data.subtotal - data.discount)) * 100) || 16,
        })

        setItems(data.items.map(item => ({
          id: item.id,
          type: item.productId ? 'product' : 'service',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          productId: item.productId || null,
        })))
      } else {
        router.push('/dashboard/quotes')
      }
    } catch (error) {
      console.error('Error fetching quote:', error)
      router.push('/dashboard/quotes')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100')
      const data = await response.json()
      if (response.ok) {
        // Ordenar clientes alfabéticamente por nombre mostrado
        const sortedClients = [...data.clients].sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}${a.companyName ? ` - ${a.companyName}` : ''}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}${b.companyName ? ` - ${b.companyName}` : ''}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setClients(sortedClients)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/settings/company')
      if (response.ok) {
        const data = await response.json()
        // Only update taxRate if not already set from quote data
        setFormData(prev => ({
          ...prev,
          taxRate: prev.taxRate || data.taxRate || 16
        }))
      }
    } catch (error) {
      console.error('Error fetching company settings:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discount' || name === 'taxRate' ? parseFloat(value) || 0 : value
    }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]

    if (field === 'type') {
      // Reset item when changing type
      newItems[index] = {
        ...newItems[index],
        type: value,
        description: '',
        quantity: newItems[index].quantity || 1,
        unitPrice: 0,
        productId: null
      }
    } else if (field === 'productId' && value) {
      // If selecting a product, auto-fill details
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          description: product.name,
          unitPrice: product.price,
        }
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value,
      }
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { type: 'service', description: '', quantity: 1, unitPrice: 0, productId: null }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discountAmount = (subtotal * formData.discount) / 100
    const subtotalAfterDiscount = subtotal - discountAmount
    const tax = (subtotalAfterDiscount * formData.taxRate) / 100
    return {
      subtotal,
      discountAmount,
      tax,
      total: subtotalAfterDiscount + tax
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validate items
    const validItems = items.filter(item => item.description && item.quantity > 0 && item.unitPrice > 0)
    if (validItems.length === 0) {
      setError('Agrega al menos un item válido')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch(`/api/quotes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: validItems,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/dashboard/quotes/${params.id}`)
      } else {
        setError(data.error || 'Error al actualizar la cotización')
      }
    } catch (err) {
      setError('Error al actualizar la cotización')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const totals = calculateTotal()

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/dashboard/quotes" className="hover:text-gray-700">
            Cotizaciones
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/dashboard/quotes/${params.id}`} className="hover:text-gray-700">
            Detalle
          </Link>
          <span className="mx-2">/</span>
          <span>Editar</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Cotización</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Client and General Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                required
                disabled
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black bg-gray-50"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                    {client.companyName && ` - ${client.companyName}`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">El cliente no se puede cambiar</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Válida hasta
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Agregar Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Producto
                    </label>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                      placeholder="Descripción del servicio o producto"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Unit. *
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm"
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {item.quantity > 0 && item.unitPrice > 0 && (
                  <div className="mt-2 text-right text-sm text-gray-600">
                    Total: {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Totals and Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              placeholder="Notas adicionales, términos y condiciones..."
            />
          </div>

          {/* Totals */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Totales</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  Descuento (%):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-20 px-2 py-1 border border-gray-300 focus:outline-none focus:border-black text-sm text-right"
                  />
                  <span className="text-sm font-medium">
                    -{formatCurrency(totals.discountAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  IVU (%):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-20 px-2 py-1 border border-gray-300 focus:outline-none focus:border-black text-sm text-right"
                  />
                  <span className="text-sm font-medium">
                    +{formatCurrency(totals.tax)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/dashboard/quotes/${params.id}`}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}