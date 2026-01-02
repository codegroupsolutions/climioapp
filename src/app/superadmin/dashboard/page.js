'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaBuilding, FaUsers, FaCreditCard, FaChartLine, FaPlus, FaCrown, FaStar, FaGem } from 'react-icons/fa'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    revenue: 0,
    planDistribution: {
      FREE: 0,
      STANDARD: 0,
      PREMIUM: 0,
      ENTERPRISE: 0
    }
  })
  const [recentCompanies, setRecentCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch companies
      const companiesRes = await fetch('/api/superadmin/companies', {
        credentials: 'include'
      })
      const companiesData = await companiesRes.json()

      // Check if response is valid
      if (!companiesRes.ok || !Array.isArray(companiesData)) {
        console.error('Invalid companies response:', companiesData)
        const companies = []

        // Set empty state
        setStats({
          totalCompanies: 0,
          activeCompanies: 0,
          totalUsers: 0,
          revenue: 0,
          planDistribution: {
            FREE: 0,
            STANDARD: 0,
            PREMIUM: 0,
            ENTERPRISE: 0
          }
        })
        setRecentCompanies([])
        return
      }

      const companies = companiesData

      // Fetch plans
      const plansRes = await fetch('/api/superadmin/subscription-plans', {
        credentials: 'include'
      })
      const plansData = await plansRes.json()
      const plans = Array.isArray(plansData) ? plansData : []

      // Calculate stats
      const stats = {
        totalCompanies: companies.length,
        activeCompanies: companies.filter(c => c.active && c.subscriptionStatus === 'ACTIVE').length,
        totalUsers: companies.reduce((sum, c) => sum + (c._count?.users || 0), 0),
        revenue: companies
          .filter(c => c.subscriptionPlan)
          .reduce((sum, c) => sum + (c.subscriptionPlan?.price || 0), 0),
        planDistribution: {
          FREE: companies.filter(c => !c.subscriptionPlan || c.subscriptionPlan.type === 'FREE').length,
          STANDARD: companies.filter(c => c.subscriptionPlan?.type === 'STANDARD').length,
          PREMIUM: companies.filter(c => c.subscriptionPlan?.type === 'PREMIUM').length,
          ENTERPRISE: companies.filter(c => c.subscriptionPlan?.type === 'ENTERPRISE').length
        }
      }

      setStats(stats)
      setRecentCompanies(companies.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
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

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800',
      TRIAL: 'bg-blue-100 text-blue-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      ACTIVE: 'Activo',
      TRIAL: 'Prueba',
      SUSPENDED: 'Suspendido',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo</h1>
          <p className="text-gray-600 mt-1">Gestión global del sistema Climio</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/superadmin/companies/new"
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <FaPlus />
            Nueva Compañía
          </Link>
          <Link
            href="/superadmin/subscription-plans"
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FaCreditCard />
            Gestionar Planes
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Compañías</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCompanies}</p>
              <p className="text-sm text-green-600 mt-1">
                {stats.activeCompanies} activas
              </p>
            </div>
            <FaBuilding className="text-3xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-1">
                En todas las compañías
              </p>
            </div>
            <FaUsers className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.revenue)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Recurrente
              </p>
            </div>
            <FaChartLine className="text-3xl text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Planes Premium</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.planDistribution.PREMIUM + stats.planDistribution.ENTERPRISE}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Suscripciones activas
              </p>
            </div>
            <FaCrown className="text-3xl text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Distribución de Planes</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaStar className="text-gray-500" />
                <span className="font-medium">Gratis</span>
                <span className="text-sm text-gray-500">(hasta 2 usuarios)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.planDistribution.FREE}</span>
                <span className="text-sm text-gray-500">compañías</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaStar className="text-blue-500" />
                <span className="font-medium">Estándar</span>
                <span className="text-sm text-gray-500">(3-5 usuarios)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.planDistribution.STANDARD}</span>
                <span className="text-sm text-gray-500">compañías</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaGem className="text-purple-500" />
                <span className="font-medium">Premium</span>
                <span className="text-sm text-gray-500">(6-15 usuarios)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.planDistribution.PREMIUM}</span>
                <span className="text-sm text-gray-500">compañías</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaCrown className="text-yellow-500" />
                <span className="font-medium">Enterprise</span>
                <span className="text-sm text-gray-500">(ilimitado)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.planDistribution.ENTERPRISE}</span>
                <span className="text-sm text-gray-500">compañías</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Companies */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Compañías Recientes</h2>
            <Link href="/superadmin/companies" className="text-sm text-blue-600 hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3">
            {recentCompanies.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay compañías registradas</p>
            ) : (
              recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaBuilding className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-gray-500">
                        {company._count?.users || 0} usuarios • {company.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.subscriptionPlan && getPlanIcon(company.subscriptionPlan.type)}
                    {getStatusBadge(company.subscriptionStatus)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/superadmin/companies"
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <FaBuilding className="text-2xl text-gray-600" />
            <div>
              <p className="font-medium">Gestionar Compañías</p>
              <p className="text-sm text-gray-500">Ver y editar todas las compañías</p>
            </div>
          </Link>

          <Link
            href="/superadmin/subscription-plans"
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <FaCreditCard className="text-2xl text-gray-600" />
            <div>
              <p className="font-medium">Planes de Suscripción</p>
              <p className="text-sm text-gray-500">Configurar planes y precios</p>
            </div>
          </Link>

          <Link
            href="/superadmin/users"
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <FaUsers className="text-2xl text-gray-600" />
            <div>
              <p className="font-medium">Usuarios del Sistema</p>
              <p className="text-sm text-gray-500">Gestionar todos los usuarios</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}