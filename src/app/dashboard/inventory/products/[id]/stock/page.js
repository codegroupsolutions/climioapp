'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function StockAdjustmentPage() {
  const router = useRouter()
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    type: 'IN',
    quantity: '',
    reason: '',
    notes: '',
    reference: '',
  })

  useEffect(() => {
    fetchProduct()
    fetchMovements()
  }, [params.id])

  useEffect(() => {
    fetchMovements()
  }, [currentPage])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setProduct(data)
      } else {
        setError('Producto no encontrado')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Error al cargar el producto')
    }
  }

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${params.id}/stock?page=${currentPage}&limit=10`)
      const data = await response.json()

      if (response.ok) {
        setMovements(data.movements)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/products/${params.id}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Stock actualizado correctamente')
        setProduct(prev => ({ ...prev, stock: data.product.stock }))
        setFormData({
          type: 'IN',
          quantity: '',
          reason: '',
          notes: '',
          reference: '',
        })
        fetchMovements()

        // Show alert if low stock
        if (data.alert) {
          setTimeout(() => {
            alert(data.alert.message)
          }, 100)
        }
      } else {
        setError(data.error || 'Error al actualizar stock')
      }
    } catch (err) {
      setError('Error al actualizar stock')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-PR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMovementTypeLabel = (type) => {
    const labels = {
      IN: 'Entrada',
      OUT: 'Salida',
      ADJUSTMENT: 'Ajuste',
    }
    return labels[type] || type
  }

  const getMovementTypeColor = (type) => {
    const colors = {
      IN: 'bg-green-100 text-green-800',
      OUT: 'bg-red-100 text-red-800',
      ADJUSTMENT: 'bg-blue-100 text-blue-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (!product && !loading) {
    return (
      <div className="max-w-full mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-lg">
          <p>{error}</p>
          <Link href="/dashboard/inventory/products" className="text-red-700 underline mt-2 inline-block">
            Volver a productos
          </Link>
        </div>
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
          <span>Ajuste de Stock</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ajuste de Stock - {product?.name}
        </h1>
      </div>

      {/* Current Stock Info */}
      {product && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Producto</p>
              <p className="text-lg font-semibold text-gray-900">{product.name}</p>
              {product.code && (
                <p className="text-sm text-gray-500">Código: {product.code}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Actual</p>
              <p className={`text-2xl font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                {product.stock} {product.unit}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Mínimo</p>
              <p className="text-lg font-semibold text-gray-900">
                {product.minStock} {product.unit}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Categoría</p>
              <p className="text-lg font-semibold text-gray-900">{product.category?.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adjustment Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Movimiento</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Movimiento *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                >
                  <option value="IN">Entrada (Sumar al stock)</option>
                  <option value="OUT">Salida (Restar del stock)</option>
                  <option value="ADJUSTMENT">Ajuste (Establecer nuevo stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'ADJUSTMENT' ? 'Nuevo Stock' : 'Cantidad'} *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder={formData.type === 'ADJUSTMENT' ? 'Nuevo stock total' : 'Cantidad a agregar/quitar'}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
                {formData.type === 'OUT' && product && (
                  <p className="mt-1 text-xs text-gray-500">
                    Stock disponible: {product.stock} {product.unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                >
                  <option value="">Seleccionar razón</option>
                  {formData.type === 'IN' && (
                    <>
                      <option value="Compra">Compra</option>
                      <option value="Devolución">Devolución de cliente</option>
                      <option value="Producción">Producción</option>
                      <option value="Transferencia">Transferencia</option>
                    </>
                  )}
                  {formData.type === 'OUT' && (
                    <>
                      <option value="Venta">Venta</option>
                      <option value="Daño">Producto dañado</option>
                      <option value="Pérdida">Pérdida</option>
                      <option value="Uso interno">Uso interno</option>
                      <option value="Muestra">Muestra</option>
                    </>
                  )}
                  {formData.type === 'ADJUSTMENT' && (
                    <>
                      <option value="Inventario físico">Inventario físico</option>
                      <option value="Corrección">Corrección de error</option>
                      <option value="Reconciliación">Reconciliación</option>
                    </>
                  )}
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Número de factura, orden, etc."
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Información adicional..."
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando...' : 'Registrar Movimiento'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Movement History */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Historial de Movimientos</h2>
          </div>
          <div className="overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : movements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay movimientos registrados
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {movements.map((movement) => (
                  <div key={movement.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(movement.type)}`}>
                            {getMovementTypeLabel(movement.type)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {movement.type === 'IN' && '+'}
                            {movement.type === 'OUT' && '-'}
                            {movement.quantity} {product?.unit}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {movement.previousStock} → {movement.newStock}
                        </div>
                        {movement.reason && (
                          <p className="mt-1 text-sm text-gray-600">
                            Razón: {movement.reason}
                          </p>
                        )}
                        {movement.reference && (
                          <p className="text-sm text-gray-600">
                            Ref: {movement.reference}
                          </p>
                        )}
                        {movement.notes && (
                          <p className="text-sm text-gray-600 italic">
                            {movement.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">
                          {formatDate(movement.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Por: {movement.user?.firstName} {movement.user?.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}