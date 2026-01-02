'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setProduct(data)
      } else {
        router.push('/dashboard/inventory/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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

  const calculateMargin = () => {
    if (product && product.cost > 0) {
      return ((product.price - product.cost) / product.cost * 100).toFixed(1)
    }
    return 0
  }

  const calculateProfit = () => {
    if (product) {
      return product.price - product.cost
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

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Producto no encontrado</p>
        <Link href="/dashboard/inventory/products" className="text-black hover:underline mt-2 inline-block">
          Volver a productos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Link href="/dashboard/inventory" className="hover:text-gray-700">
              Inventario
            </Link>
            <span className="mx-2">/</span>
            <Link href="/dashboard/inventory/products" className="hover:text-gray-700">
              Productos
            </Link>
            <span className="mx-2">/</span>
            <span>{product.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.code && (
            <p className="text-gray-600">Código: {product.code}</p>
          )}
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/inventory/products/${product.id}/stock`}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Ajustar Stock
          </Link>
          <Link
            href={`/dashboard/inventory/products/${product.id}/edit`}
            className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Editar Producto
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Actual</p>
              <p className={`text-2xl font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                {product.stock} {product.unit}
              </p>
              {product.stock <= product.minStock && (
                <p className="text-xs text-red-600 mt-1">Stock bajo</p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${product.stock <= product.minStock ? 'bg-red-100' : 'bg-green-100'}`}>
              <svg className={`w-6 h-6 ${product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Precio de Venta</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(product.price)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Por {product.unit}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Margen</p>
              <p className="text-2xl font-bold text-gray-900">{calculateMargin()}%</p>
              <p className="text-xs text-green-600 mt-1">
                +{formatCurrency(calculateProfit())}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor en Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(product.stock * product.price)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Costo: {formatCurrency(product.stock * product.cost)}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'text-black border-black'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Información General
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'movements'
                  ? 'text-black border-black'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Movimientos ({product.inventoryMovements?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'quotes'
                  ? 'text-black border-black'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Cotizaciones ({product.quoteItems?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invoices'
                  ? 'text-black border-black'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Facturas ({product.invoiceItems?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* General Information Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Detalles del Producto</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Categoría:</dt>
                      <dd className="text-sm font-medium text-gray-900">{product.category.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Código:</dt>
                      <dd className="text-sm font-medium text-gray-900">{product.code || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Unidad:</dt>
                      <dd className="text-sm font-medium text-gray-900">{product.unit}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Stock Mínimo:</dt>
                      <dd className="text-sm font-medium text-gray-900">{product.minStock} {product.unit}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Información de Precios</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Costo:</dt>
                      <dd className="text-sm font-medium text-gray-900">{formatCurrency(product.cost)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Precio de Venta:</dt>
                      <dd className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Ganancia por Unidad:</dt>
                      <dd className="text-sm font-medium text-green-600">{formatCurrency(calculateProfit())}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Margen de Ganancia:</dt>
                      <dd className="text-sm font-medium text-gray-900">{calculateMargin()}%</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {product.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Descripción</h3>
                  <p className="text-sm text-gray-700">{product.description}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-600">Creado:</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">
                      {formatDate(product.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Última actualización:</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">
                      {formatDate(product.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Movements Tab */}
          {activeTab === 'movements' && (
            <div>
              {product.inventoryMovements?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock Anterior
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock Nuevo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {product.inventoryMovements.map((movement) => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(movement.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(movement.type)}`}>
                              {getMovementTypeLabel(movement.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {movement.type === 'IN' && '+'}
                            {movement.type === 'OUT' && '-'}
                            {movement.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {movement.previousStock}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {movement.newStock}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {movement.user?.firstName} {movement.user?.lastName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay movimientos registrados</p>
              )}

              <div className="mt-4 text-center">
                <Link
                  href={`/dashboard/inventory/products/${product.id}/stock`}
                  className="text-black hover:underline text-sm font-medium"
                >
                  Ver todos los movimientos →
                </Link>
              </div>
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <div>
              {product.quoteItems?.length > 0 ? (
                <div className="space-y-3">
                  {product.quoteItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Cotización #{item.quote.number}
                          </p>
                          <p className="text-sm text-gray-600">
                            Cliente: {item.quote.client.firstName} {item.quote.client.lastName}
                            {item.quote.client.companyName && ` - ${item.quote.client.companyName}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Fecha: {new Date(item.quote.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: {formatCurrency(item.total)}
                          </p>
                          <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            item.quote.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            item.quote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.quote.status === 'ACCEPTED' ? 'Aceptada' :
                             item.quote.status === 'REJECTED' ? 'Rechazada' :
                             item.quote.status === 'SENT' ? 'Enviada' :
                             'Borrador'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay cotizaciones con este producto</p>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              {product.invoiceItems?.length > 0 ? (
                <div className="space-y-3">
                  {product.invoiceItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Factura #{item.invoice.number}
                          </p>
                          <p className="text-sm text-gray-600">
                            Cliente: {item.invoice.client.firstName} {item.invoice.client.lastName}
                            {item.invoice.client.companyName && ` - ${item.invoice.client.companyName}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Fecha: {new Date(item.invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: {formatCurrency(item.total)}
                          </p>
                          <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            item.invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                            item.invoice.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.invoice.status === 'PAID' ? 'Pagada' :
                             item.invoice.status === 'OVERDUE' ? 'Vencida' :
                             item.invoice.status === 'CANCELLED' ? 'Cancelada' :
                             'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay facturas con este producto</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}