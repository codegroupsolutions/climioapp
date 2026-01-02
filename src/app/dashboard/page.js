'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClients: 0,
    activeQuotes: 0,
    pendingInvoices: 0,
    pendingInvoicesAmount: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    inventoryAlerts: 0,
    recentActivities: [],
    upcomingAppointments: [],
    monthlyStats: {
      clientGrowth: 0,
      revenueGrowth: 0,
      newClients: 0
    }
  })

  useEffect(() => {
    // Redirect technicians to appointments page
    if (user?.role === 'TECHNICIAN') {
      router.push('/dashboard/appointments')
      return
    }
    fetchDashboardStats()
  }, [user, router])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Error al cargar estadísticas')

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTypeLabel = (type) => {
    const labels = {
      SERVICE: 'Servicio',
      INSTALLATION: 'Instalación',
      MAINTENANCE: 'Mantenimiento',
      REPAIR: 'Reparación',
      INSPECTION: 'Inspección',
      CONSULTATION: 'Consulta'
    }
    return labels[type] || type
  }

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      SCHEDULED: 'Programado',
      IN_PROGRESS: 'En Proceso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado'
    }
    return labels[status] || status
  }

  const statsCards = [
    {
      title: 'Clientes Totales',
      value: stats.totalClients,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      change: stats.monthlyStats?.clientGrowth ? `${stats.monthlyStats.clientGrowth > 0 ? '+' : ''}${stats.monthlyStats.clientGrowth}%` : '0%',
      changeType: stats.monthlyStats?.clientGrowth > 0 ? 'positive' : 'neutral',
      link: '/dashboard/clients'
    },
    {
      title: 'Cotizaciones Activas',
      value: stats.activeQuotes,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      change: stats.monthlyStats?.newClients ? `${stats.monthlyStats.newClients} este mes` : '0 este mes',
      changeType: 'neutral',
      link: '/dashboard/quotes'
    },
    {
      title: 'Facturas Pendientes',
      value: stats.pendingInvoices,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      change: formatCurrency(stats.pendingInvoicesAmount),
      changeType: stats.pendingInvoices > 0 ? 'warning' : 'neutral',
      link: '/dashboard/invoices'
    },
    {
      title: 'Citas de Hoy',
      value: stats.todayAppointments,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      change: stats.upcomingAppointments?.length > 0 ? `Próxima: ${stats.upcomingAppointments[0].time}` : 'Sin citas',
      changeType: 'neutral',
      link: '/dashboard/appointments'
    }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user?.firstName}
          </h1>
          <p className="text-gray-600">
            Aquí está el resumen de tu negocio hoy
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Link key={index} href={stat.link}>
              <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {stat.icon}
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' :
                    stat.changeType === 'warning' ? 'text-yellow-600' :
                    'text-gray-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-gray-600 text-sm mt-1">{stat.title}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
            </div>
            <div className="p-6">
              {stats.recentActivities?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <span className="text-2xl">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No hay actividad reciente</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/quotes/new')}
                  className="w-full px-4 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  Nueva Cotización
                </button>
                <button
                  onClick={() => router.push('/dashboard/clients/new')}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium hover:border-black transition-colors"
                >
                  Registrar Cliente
                </button>
                <button
                  onClick={() => router.push('/dashboard/appointments/new')}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium hover:border-black transition-colors"
                >
                  Agendar Cita
                </button>
                <button
                  onClick={() => router.push('/dashboard/invoices/new')}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium hover:border-black transition-colors"
                >
                  Crear Factura
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Citas de Hoy</h2>
            <Link href="/dashboard/appointments" className="text-sm text-gray-600 hover:text-black">
              Ver todas
            </Link>
          </div>
          <div className="overflow-x-auto">
            {stats.upcomingAppointments?.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asignado a
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.upcomingAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {appointment.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {appointment.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getTypeLabel(appointment.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {appointment.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {appointment.technician}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No hay citas programadas para hoy
              </div>
            )}
          </div>
        </div>

        {/* Revenue Chart and Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingresos del Mes</h2>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
                <p className={`text-sm ${
                  stats.monthlyStats?.revenueGrowth > 0 ? 'text-green-600' :
                  stats.monthlyStats?.revenueGrowth < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stats.monthlyStats?.revenueGrowth > 0 ? '+' : ''}{stats.monthlyStats?.revenueGrowth || 0}% vs mes anterior
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/invoices"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver facturas →
                </Link>
              </div>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas de Inventario</h2>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.inventoryAlerts}
                </p>
                <p className="text-sm text-gray-600">
                  Productos con stock bajo
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/inventory"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver inventario →
                </Link>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}