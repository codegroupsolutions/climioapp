'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { generateInvoicePDF } from '@/utils/generateInvoicePDF'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    fetchClient()
  }, [params.id])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      if (response.ok) {
        const data = await response.json()

        // If user is technician, verify they have access to this client
        if (user?.role === 'TECHNICIAN') {
          const hasAccess = data.appointments?.some(
            appointment => appointment.technicianId === user.id
          )
          if (!hasAccess) {
            router.push('/dashboard/clients')
            return
          }
        }

        setClient(data)
      } else {
        router.push('/dashboard/clients')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  const tabs = [
    { id: 'info', name: 'Información', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'invoices', name: 'Facturas', count: client.invoices?.length || 0, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'appointments', name: 'Citas', count: client.appointments?.length || 0, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ]

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/dashboard/clients" className="hover:text-gray-700">
            Clientes
          </Link>
          <span className="mx-2">/</span>
          <span>{client.firstName} {client.lastName}</span>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            {client.companyName && (
              <p className="text-lg text-gray-600 mt-1">{client.companyName}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                client.type === 'COMMERCIAL'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {client.type === 'COMMERCIAL' ? 'Comercial' : 'Residencial'}
              </span>
              <span className="text-sm text-gray-500">
                Cliente desde {new Date(client.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/dashboard/clients/${client.id}/edit`}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Editar
            </Link>
            <Link
              href={`/dashboard/invoices/new?clientId=${client.id}`}
              className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Nueva Factura
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'info' && (
          <>
            {/* Contact Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Teléfono Principal</p>
                    <p className="text-gray-900 font-medium">{client.phone}</p>
                  </div>
                  {client.alternativePhone && (
                    <div>
                      <p className="text-sm text-gray-500">Teléfono Alternativo</p>
                      <p className="text-gray-900 font-medium">{client.alternativePhone}</p>
                    </div>
                  )}
                  {client.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium">{client.email}</p>
                    </div>
                  )}
                  {client.contactPerson && (
                    <div>
                      <p className="text-sm text-gray-500">Persona de Contacto</p>
                      <p className="text-gray-900 font-medium">{client.contactPerson}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección</h2>
                <div>
                  <p className="text-gray-900">{client.address}</p>
                  <p className="text-gray-900">
                    {client.city}, {client.state} {client.zipCode}
                  </p>
                  {(client.latitude && client.longitude) && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-500">
                        📍 GPS: {client.latitude.toFixed(6)}, {client.longitude.toFixed(6)}
                      </p>
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${client.latitude},${client.longitude}`
                          window.open(url, '_blank')
                        }}
                        className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ver en Google Maps
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {client.notes && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Facturas</span>
                    <span className="font-medium">{client.invoices?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Citas</span>
                    <span className="font-medium">{client.appointments?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/invoices/new?clientId=${client.id}`}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors block"
                  >
                    💰 Crear Factura
                  </Link>
                  <Link
                    href={`/dashboard/appointments/new?clientId=${client.id}`}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors block"
                  >
                    📅 Agendar Cita
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'invoices' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Facturas</h2>
                <Link
                  href={`/dashboard/invoices/new?clientId=${client.id}`}
                  className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Nueva Factura
                </Link>
              </div>
              {client.invoices?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {client.invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link
                              href={`/dashboard/invoices/${invoice.id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {invoice.number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invoice.status === 'PAID' ? 'Pagada' :
                               invoice.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${invoice.total?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/invoices/${invoice.id}`}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ver detalle"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    // Fetch full invoice data for PDF
                                    const response = await fetch(`/api/invoices/${invoice.id}`)
                                    if (response.ok) {
                                      const fullInvoice = await response.json()
                                      const doc = await generateInvoicePDF(fullInvoice)
                                      doc.save(`${fullInvoice.number || invoice.number}.pdf`)
                                    } else {
                                      alert('Error al cargar los datos de la factura')
                                    }
                                  } catch (error) {
                                    console.error('Error generating PDF:', error)
                                    alert('Error al generar el PDF')
                                  }
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Descargar PDF"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <p className="mb-4">No hay facturas para este cliente</p>
                  <Link
                    href={`/dashboard/invoices/new?clientId=${client.id}`}
                    className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Crear primera factura
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Citas</h2>
                <button className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                  Agendar Cita
                </button>
              </div>
              {client.appointments?.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {client.appointments.map((appointment) => (
                    <div key={appointment.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(appointment.startDate).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Técnico: {appointment.technician?.firstName} {appointment.technician?.lastName}
                          </p>
                        </div>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          appointment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  No hay citas programadas para este cliente
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}