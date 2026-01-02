'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  FaHome, FaBuilding, FaCreditCard, FaUsers, FaBars, FaTimes,
  FaSignOutAlt, FaShieldAlt, FaChartLine
} from 'react-icons/fa'

export default function SuperAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/superadmin/auth/check', {
        credentials: 'include'
      })

      if (!response.ok) {
        router.push('/superadmin/login')
      } else {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/superadmin/login')
    }
  }

  useEffect(() => {
    // Skip auth check for login page
    if (pathname !== '/superadmin/login') {
      checkAuth()
    }
  }, [pathname])

  // Skip layout for login page
  if (pathname === '/superadmin/login') {
    return children
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/superadmin/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/superadmin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/superadmin/dashboard', icon: FaHome },
    { name: 'Compañías', href: '/superadmin/companies', icon: FaBuilding },
    { name: 'Planes', href: '/superadmin/subscription-plans', icon: FaCreditCard },
    { name: 'Usuarios', href: '/superadmin/users', icon: FaUsers },
    { name: 'Reportes', href: '/superadmin/reports', icon: FaChartLine },
  ]

  const isActive = (href) => pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <FaShieldAlt className="text-xl text-black" />
              </div>
              <div>
                <h2 className="text-white font-bold">Climio</h2>
                <p className="text-xs text-gray-400">CRM Control</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>

          {/* User info */}
          {user && (
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-xs text-gray-400">Sesión activa</p>
              <p className="text-sm text-white font-medium truncate">{user.email}</p>
              <p className="text-xs text-gray-400 truncate">{user.name}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-white text-black'
                      : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-900 hover:text-white rounded-lg transition-colors"
            >
              <FaSignOutAlt className="mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <FaBars className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <FaShieldAlt className="text-gray-600" />
              <span className="font-medium text-gray-900">Panel Climio</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}