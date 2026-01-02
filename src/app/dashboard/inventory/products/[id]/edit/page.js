'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    cost: '',
    price: '',
    minStock: '0',
    unit: 'pza',
    imageUrl: '',
  })

  useEffect(() => {
    fetchProduct()
    fetchCategories()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setFormData({
          code: data.code || '',
          name: data.name || '',
          description: data.description || '',
          categoryId: data.categoryId || '',
          cost: data.cost || '',
          price: data.price || '',
          minStock: data.minStock || '0',
          unit: data.unit || 'pza',
          imageUrl: data.imageUrl || '',
        })
      } else {
        setError('Producto no encontrado')
        router.push('/dashboard/inventory/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Error al cargar el producto')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Auto-calculate price based on cost and margin
    if (name === 'cost' && value) {
      const cost = parseFloat(value)
      if (!isNaN(cost)) {
        const currentPrice = parseFloat(formData.price) || 0
        if (currentPrice === 0) {
          // Only auto-calculate if price is not set
          const price = cost * 1.5 // 50% margin by default
          setFormData(prev => ({ ...prev, price: price.toFixed(2) }))
        }
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/dashboard/inventory/products/${params.id}`)
      } else {
        setError(data.error || 'Error al actualizar el producto')
      }
    } catch (err) {
      setError('Error al actualizar el producto')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0)
  }

  const calculateMargin = () => {
    const cost = parseFloat(formData.cost) || 0
    const price = parseFloat(formData.price) || 0
    if (cost > 0) {
      const margin = ((price - cost) / cost) * 100
      return margin.toFixed(1)
    }
    return 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/dashboard/inventory" className="hover:text-gray-700">
            Inventario
          </Link>
          <span className="mx-2">/</span>
          <Link href="/dashboard/inventory/products" className="hover:text-gray-700">
            Productos
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/dashboard/inventory/products/${params.id}`} className="hover:text-gray-700">
            {formData.name}
          </Link>
          <span className="mx-2">/</span>
          <span>Editar</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código del Producto
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="SKU o código interno"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                placeholder="Descripción del producto..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              >
                {categories.length === 0 ? (
                  <option value="">Sin categorías disponibles</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Medida
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              >
                <option value="pza">Pieza</option>
                <option value="kg">Kilogramo</option>
                <option value="lt">Litro</option>
                <option value="m">Metro</option>
                <option value="caja">Caja</option>
                <option value="paquete">Paquete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo *
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
              <p className="mt-1 text-xs text-gray-500">Precio de compra</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Venta *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
              <p className="mt-1 text-xs text-gray-500">Precio al cliente</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Margen de Ganancia
              </label>
              <div className="px-3 py-2 border border-gray-300 bg-gray-50">
                <span className="font-semibold">{calculateMargin()}%</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Calculado automáticamente</p>
            </div>
          </div>
          {formData.cost && formData.price && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Costo:</span>
                  <span className="font-medium ml-2">{formatCurrency(formData.cost)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Precio:</span>
                  <span className="font-medium ml-2">{formatCurrency(formData.price)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ganancia:</span>
                  <span className="font-medium ml-2 text-green-600">
                    {formatCurrency(formData.price - formData.cost)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Settings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Inventario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
              <p className="mt-1 text-xs text-gray-500">Nivel mínimo para alertas</p>
            </div>
            <div className="flex items-center">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> El stock actual no se puede modificar desde aquí.
                  Usa la función de "Ajustar Stock" para registrar movimientos de inventario.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Image URL */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagen</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de la Imagen
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt={formData.name}
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/dashboard/inventory/products/${params.id}`}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || categories.length === 0}
            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}