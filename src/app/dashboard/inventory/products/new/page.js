'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    cost: '',
    price: '',
    stock: '0',
    minStock: '0',
    unit: 'pza',
    imageUrl: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data)
        if (data.length > 0 && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: data[0].id }))
        }
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
        const price = cost * 1.5 // 50% margin by default
        setFormData(prev => ({ ...prev, price: price.toFixed(2) }))
      }
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError('Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP)')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setError('El archivo es demasiado grande. Máximo 5MB')
        return
      }

      setImageFile(file)
      setError('')

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async () => {
    if (!imageFile) return null

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', imageFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.url
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir la imagen')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Upload image first if there's one
      let imageUrl = formData.imageUrl
      if (imageFile) {
        try {
          imageUrl = await uploadImage()
        } catch (error) {
          setError('Error al subir la imagen: ' + error.message)
          setLoading(false)
          return
        }
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, imageUrl }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard/inventory/products')
      } else {
        setError(data.error || 'Error al crear el producto')
      }
    } catch (err) {
      setError('Error al crear el producto')
    } finally {
      setLoading(false)
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
          <span>Nuevo Producto</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
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
              {categories.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  <Link href="/dashboard/inventory/categories" className="text-black hover:underline">
                    Crear una categoría primero
                  </Link>
                </p>
              )}
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

        {/* Inventory */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Inicial
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
              <p className="mt-1 text-xs text-gray-500">Cantidad disponible inicial</p>
            </div>
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
          </div>
        </div>

        {/* Image */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagen</h2>
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subir Imagen
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
              <p className="mt-1 text-xs text-gray-500">
                Formatos permitidos: JPEG, PNG, WebP. Tamaño máximo: 5MB
              </p>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="max-w-xs max-h-48 border border-gray-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/dashboard/inventory/products"
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || uploadingImage || categories.length === 0}
            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingImage ? 'Subiendo imagen...' : loading ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  )
}