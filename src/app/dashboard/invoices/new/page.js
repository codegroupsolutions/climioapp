'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatDateForInput, parseInputDate, getTodayInputDate, addDaysToInputDate } from '@/utils/dateUtils'
import SearchableSelect from '@/components/ui/SearchableSelect'

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quoteId')
  const clientIdParam = searchParams.get('clientId')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    clientId: clientIdParam || '',
    quoteId: quoteId || null,
    date: getTodayInputDate(), // Fecha de la factura
    dueDate: '',
    notes: '',
    discount: 0,
    taxRate: 16,
    paymentTerms: 30,
    type: 'SERVICE',
  })

  const [items, setItems] = useState([
    { type: 'service', description: '', quantity: 1, unitPrice: 0, productId: null }
  ])

  useEffect(() => {
    fetchClients()
    fetchProducts()
    fetchCompanySettings()
    if (quoteId) {
      fetchQuote(quoteId)
    }
  }, [quoteId])

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
        setFormData(prev => ({
          ...prev,
          taxRate: data.taxRate || 16
        }))
      }
    } catch (error) {
      console.error('Error fetching company settings:', error)
    }
  }

  const fetchQuote = async (id) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotes/${id}`)
      const data = await response.json()

      if (response.ok) {
        setQuote(data)

        // Pre-fill form with quote data
        setFormData(prev => ({
          ...prev,
          clientId: data.clientId,
          quoteId: data.id,
          notes: data.notes || '',
          discount: data.discount ? ((data.discount / data.subtotal) * 100) : 0,
          taxRate: data.tax ? ((data.tax / (data.subtotal - data.discount)) * 100) : 16,
        }))

        // Pre-fill items from quote
        setItems(data.items.map(item => ({
          type: item.productId ? 'product' : 'service', // Determine type based on productId
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          productId: item.productId || null,
        })))
      } else {
        setError('No se pudo cargar la cotización')
      }
    } catch (error) {
      console.error('Error fetching quote:', error)
      setError('Error al cargar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discount' || name === 'taxRate' || name === 'paymentTerms'
        ? parseFloat(value) || 0
        : value
    }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]

    if (field === 'type') {
      // Reset item when changing type
      newItems[index] = {
        type: value,
        description: '',
        quantity: 1,
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
        [field]: field === 'quantity' || field === 'unitPrice'
          ? parseFloat(value) || 0
          : value,
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

    // Validate client
    if (!formData.clientId) {
      setError('Selecciona un cliente')
      setSubmitting(false)
      return
    }

    // Validate items
    const validItems = items.filter(item => item.description && item.quantity > 0 && item.unitPrice > 0)
    if (validItems.length === 0) {
      setError('Agrega al menos un item válido')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
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
        router.push(`/dashboard/invoices/${data.id}`)
      } else {
        setError(data.error || 'Error al crear la factura')
      }
    } catch (err) {
      setError('Error al crear la factura')
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

  const calculateDueDate = () => {
    if (formData.dueDate) return formData.dueDate
    // Calcular fecha de vencimiento basada en la fecha de factura + términos de pago
    const baseDate = formData.date || getTodayInputDate()
    return addDaysToInputDate(baseDate, formData.paymentTerms || 30)
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
          <Link href="/dashboard/invoices" className="hover:text-gray-700">
            Facturas
          </Link>
          <span className="mx-2">/</span>
          <span>Nueva</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {quoteId && quote ? `Nueva Factura desde ${quote.number}` : 'Nueva Factura'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Quote Reference */}
        {quote && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Creando factura desde cotización
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {quote.number} - {quote.client.firstName} {quote.client.lastName}
                </p>
              </div>
              <Link
                href={`/dashboard/quotes/${quote.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Ver cotización
              </Link>
            </div>
          </div>
        )}

        {/* Client and General Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <SearchableSelect
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                options={clients}
                placeholder="Seleccionar cliente"
                searchPlaceholder="Buscar cliente..."
                noResultsText="No se encontraron clientes"
                required
                disabled={!!quote}
                getOptionValue={(client) => client.id}
                getOptionLabel={(client) =>
                  `${client.firstName} ${client.lastName}${client.companyName ? ` - ${client.companyName}` : ''}`
                }
              />
              {quote && (
                <p className="mt-1 text-xs text-gray-500">
                  Cliente heredado de la cotización
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de factura *
              </label>
              <SearchableSelect
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={[
                  { value: 'SERVICE', label: 'Servicio' },
                  { value: 'EQUIPMENT', label: 'Equipo' }
                ]}
                placeholder="Seleccionar tipo"
                searchPlaceholder="Buscar tipo..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de factura *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de vencimiento
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate || calculateDueDate()}
                onChange={handleChange}
                min={formData.date}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Términos de pago (días)
              </label>
              <input
                type="number"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Inventory Warning */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Importante: Control de Inventario</p>
                <p className="mt-1">Al crear esta factura, el stock de los productos seleccionados será descontado automáticamente del inventario.</p>
              </div>
            </div>
          </div>

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
                  {/* Type selector */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <SearchableSelect
                      value={item.type || 'service'}
                      onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                      options={[
                        { value: 'service', label: 'Servicio' },
                        { value: 'product', label: 'Producto' }
                      ]}
                      placeholder="Seleccionar tipo"
                      searchPlaceholder="Buscar..."
                    />
                  </div>

                  {/* Product selector - only show if type is product */}
                  {item.type === 'product' ? (
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto
                      </label>
                      <SearchableSelect
                        value={item.productId || ''}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        options={products}
                        placeholder="Seleccionar producto"
                        searchPlaceholder="Buscar producto..."
                        noResultsText="No se encontraron productos"
                        getOptionValue={(product) => product.id}
                        getOptionLabel={(product) => `${product.name} - ${formatCurrency(product.price)}`}
                      />
                    </div>
                  ) : null}

                  <div className={item.type === 'product' ? "md:col-span-2" : "md:col-span-5"}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                      placeholder={item.type === 'service' ? "Descripción del servicio" : "Descripción del producto"}
                      readOnly={item.type === 'product' && item.productId}
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
              placeholder="Notas adicionales, instrucciones de pago..."
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
            href="/dashboard/invoices"
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creando...' : 'Crear Factura'}
          </button>
        </div>
      </form>
    </div>
  )
}