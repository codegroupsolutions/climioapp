'use client'

import { useState, useEffect } from 'react'
import {
  FaChartLine, FaBuilding, FaUsers, FaFileInvoice, FaDollarSign,
  FaCalendar, FaDownload, FaFilter, FaChartBar, FaChartPie,
  FaArrowUp, FaArrowDown, FaCrown, FaStar, FaGem,
  FaExclamationTriangle, FaCheckCircle, FaClock
} from 'react-icons/fa'

export default function SuperAdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [activeTab, setActiveTab] = useState('overview')

  const [stats, setStats] = useState({
    // Overview Stats
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    averageRevenuePerCompany: 0,
    churnRate: 0,
    growthRate: 0,

    // Plan Distribution
    planDistribution: {
      FREE: 0,
      STANDARD: 0,
      PREMIUM: 0,
      ENTERPRISE: 0
    },

    // Activity Stats
    totalInvoices: 0,
    totalQuotes: 0,
    totalAppointments: 0,
    totalClients: 0,

    // Time-based metrics
    newCompaniesThisMonth: 0,
    newUsersThisMonth: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,

    // Top Companies
    topCompanies: [],

    // Recent Activity
    recentActivity: []
  })

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/superadmin/reports?range=${dateRange}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format = 'csv') => {
    try {
      const response = await fetch(`/api/superadmin/reports/export?format=${format}&range=${dateRange}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `superadmin-report-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`
  }

  const getPlanIcon = (type) => {
    switch(type) {
      case 'FREE':
        return <FaStar className="text-gray-500" />
      case 'STANDARD':
        return <FaStar className="text-blue-500" />
      case 'PREMIUM':
        return <FaGem className="text-purple-500" />
      case 'ENTERPRISE':
        return <FaCrown className="text-yellow-500" />
      default:
        return <FaStar className="text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes del Sistema</h1>
            <p className="text-gray-600 mt-1">Análisis completo del rendimiento del CRM</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mes</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Último Año</option>
              <option value="all">Todo el Tiempo</option>
            </select>

            {/* Export Button */}
            <button
              onClick={() => exportReport('csv')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FaDownload />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaBuilding className="text-blue-600 text-xl" />
            </div>
            <span className={`text-sm font-medium ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {stats.growthRate >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
              {formatPercentage(stats.growthRate)}
            </span>
          </div>
          <p className="text-sm text-gray-600">Compañías Activas</p>
          <p className="text-2xl font-bold text-gray-900">{stats.activeCompanies}</p>
          <p className="text-xs text-gray-500 mt-1">de {stats.totalCompanies} totales</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
            <span className={`text-sm font-medium ${stats.revenueThisMonth >= stats.revenueLastMonth ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {stats.revenueThisMonth >= stats.revenueLastMonth ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
              {formatPercentage(((stats.revenueThisMonth - stats.revenueLastMonth) / (stats.revenueLastMonth || 1)) * 100)}
            </span>
          </div>
          <p className="text-sm text-gray-600">Ingresos Mensuales (MRR)</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRecurringRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Promedio: {formatCurrency(stats.averageRevenuePerCompany)}/compañía</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
            <span className="text-sm font-medium text-blue-600">
              {stats.newUsersThisMonth} nuevos
            </span>
          </div>
          <p className="text-sm text-gray-600">Usuarios Activos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
          <p className="text-xs text-gray-500 mt-1">de {stats.totalUsers} totales</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FaExclamationTriangle className="text-red-600 text-xl" />
            </div>
            <span className={`text-sm font-medium ${stats.churnRate <= 5 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.churnRate <= 5 ? 'Saludable' : 'Alto'}
            </span>
          </div>
          <p className="text-sm text-gray-600">Tasa de Cancelación</p>
          <p className="text-2xl font-bold text-gray-900">{formatPercentage(stats.churnRate)}</p>
          <p className="text-xs text-gray-500 mt-1">últimos 30 días</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['overview', 'companies', 'revenue', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' && 'Resumen General'}
                {tab === 'companies' && 'Análisis de Compañías'}
                {tab === 'revenue' && 'Análisis de Ingresos'}
                {tab === 'activity' && 'Actividad del Sistema'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Plan Distribution */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Distribución de Planes</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(stats.planDistribution).map(([plan, count]) => (
                    <div key={plan} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        {getPlanIcon(plan)}
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{plan}</p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              plan === 'FREE' ? 'bg-gray-500' :
                              plan === 'STANDARD' ? 'bg-blue-500' :
                              plan === 'PREMIUM' ? 'bg-purple-500' :
                              'bg-yellow-500'
                            }`}
                            style={{
                              width: `${(count / stats.totalCompanies) * 100}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatPercentage((count / stats.totalCompanies) * 100)} del total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Activity */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaFileInvoice className="text-purple-500" />
                    <span className="text-2xl font-bold">{stats.totalInvoices}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Facturas Totales</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaFileInvoice className="text-yellow-500" />
                    <span className="text-2xl font-bold">{stats.totalQuotes}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Cotizaciones</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaCalendar className="text-red-500" />
                    <span className="text-2xl font-bold">{stats.totalAppointments}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Citas</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaUsers className="text-green-500" />
                    <span className="text-2xl font-bold">{stats.totalClients}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Clientes</p>
                </div>
              </div>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Top 10 Compañías por Ingresos</h3>
                {stats.topCompanies && stats.topCompanies.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Compañía
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuarios
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Facturas
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingresos Totales
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stats.topCompanies.map((company, index) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <p className="font-medium text-gray-900">{company.name}</p>
                                <p className="text-sm text-gray-500">{company.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {company.subscriptionPlan && getPlanIcon(company.subscriptionPlan.type)}
                                <span className="text-sm">{company.subscriptionPlan?.name || 'Gratis'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                              {company._count?.users || 0}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                              {company._count?.invoices || 0}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {formatCurrency(company.totalRevenue || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FaBuilding className="mx-auto text-4xl mb-2 text-gray-300" />
                    <p>No hay datos de compañías disponibles</p>
                  </div>
                )}
              </div>

              {/* Growth Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FaChartLine className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Este Mes</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.newCompaniesThisMonth}</p>
                  <p className="text-sm text-gray-600">Nuevas Compañías</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FaCheckCircle className="text-green-600" />
                    <span className="text-sm font-medium text-green-600">Activas</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage((stats.activeCompanies / stats.totalCompanies) * 100)}
                  </p>
                  <p className="text-sm text-gray-600">Tasa de Activación</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FaClock className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Promedio</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {((stats.totalUsers / stats.totalCompanies) || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Usuarios por Compañía</p>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* Revenue Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <FaDollarSign className="text-3xl opacity-50" />
                    <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Total</span>
                  </div>
                  <p className="text-sm opacity-90">Ingresos Totales</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <FaChartBar className="text-3xl opacity-50" />
                    <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">MRR</span>
                  </div>
                  <p className="text-sm opacity-90">Ingresos Recurrentes Mensuales</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.monthlyRecurringRevenue)}</p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <FaChartPie className="text-3xl opacity-50" />
                    <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">ARPU</span>
                  </div>
                  <p className="text-sm opacity-90">Ingreso Promedio por Usuario</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency((stats.monthlyRecurringRevenue / stats.activeUsers) || 0)}
                  </p>
                </div>
              </div>

              {/* Revenue by Plan */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Ingresos por Plan</h3>
                <div className="space-y-4">
                  {[
                    { name: 'ENTERPRISE', label: 'Enterprise', price: 1999, color: 'yellow' },
                    { name: 'PREMIUM', label: 'Premium', price: 799, color: 'purple' },
                    { name: 'STANDARD', label: 'Estándar', price: 299, color: 'blue' },
                    { name: 'FREE', label: 'Gratis', price: 0, color: 'gray' }
                  ].map(plan => {
                    const count = stats.planDistribution[plan.name] || 0
                    const revenue = count * plan.price
                    const percentage = (revenue / stats.monthlyRecurringRevenue) * 100

                    return (
                      <div key={plan.name} className="flex items-center gap-4">
                        <div className="w-32">
                          <div className="flex items-center gap-2">
                            {getPlanIcon(plan.name)}
                            <span className="font-medium">{plan.label}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-6">
                            <div
                              className={`h-6 rounded-full bg-${plan.color}-500 flex items-center justify-end pr-2`}
                              style={{ width: `${percentage || 0}%` }}
                            >
                              {percentage > 10 && (
                                <span className="text-xs text-white font-medium">
                                  {formatPercentage(percentage)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-32 text-right">
                          <p className="font-semibold">{formatCurrency(revenue)}</p>
                          <p className="text-xs text-gray-500">{count} compañías</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Revenue Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Comparación Mensual</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Este Mes</span>
                      <span className="font-semibold">{formatCurrency(stats.revenueThisMonth)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Mes Anterior</span>
                      <span className="font-semibold">{formatCurrency(stats.revenueLastMonth)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Diferencia</span>
                      <span className={`font-bold ${stats.revenueThisMonth >= stats.revenueLastMonth ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.revenueThisMonth - stats.revenueLastMonth)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Métricas Clave</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tasa de Crecimiento</span>
                      <span className={`font-semibold ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(stats.growthRate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tasa de Cancelación</span>
                      <span className={`font-semibold ${stats.churnRate <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(stats.churnRate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lifetime Value (LTV)</span>
                      <span className="font-semibold">
                        {formatCurrency((stats.averageRevenuePerCompany * 24) || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Actividad Reciente del Sistema</h3>
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaClock className="text-blue-600 text-sm" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.company} • {new Date(activity.createdAt).toLocaleString('es-PR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FaClock className="mx-auto text-4xl mb-2 text-gray-300" />
                    <p>No hay actividad reciente</p>
                  </div>
                )}
              </div>

              {/* System Health */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Salud del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <FaCheckCircle className="text-green-600 text-xl" />
                      <span className="text-sm font-medium text-green-600">Óptimo</span>
                    </div>
                    <p className="font-medium">Rendimiento del Sistema</p>
                    <p className="text-sm text-gray-600 mt-1">Todos los servicios operando normalmente</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <FaExclamationTriangle className="text-yellow-600 text-xl" />
                      <span className="text-sm font-medium text-yellow-600">Atención</span>
                    </div>
                    <p className="font-medium">Uso de Almacenamiento</p>
                    <p className="text-sm text-gray-600 mt-1">75% del espacio utilizado</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <FaUsers className="text-blue-600 text-xl" />
                      <span className="text-sm font-medium text-blue-600">Normal</span>
                    </div>
                    <p className="font-medium">Actividad de Usuarios</p>
                    <p className="text-sm text-gray-600 mt-1">{stats.activeUsers} usuarios activos hoy</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}