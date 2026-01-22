'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Profile state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  // Company state
  const [company, setCompany] = useState({
    name: '',
    address: '',
    postalAddress: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    taxRate: 11.5
  })

  // Password state
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const tabs = [
    { id: 'profile', name: 'Mi Perfil', icon: '👤' },
    { id: 'company', name: 'Empresa', icon: '🏢', adminOnly: true },
    { id: 'password', name: 'Seguridad', icon: '🔒' },
    // { id: 'preferences', name: 'Preferencias', icon: '⚙️' }
  ]

  useEffect(() => {
    fetchProfile()
    if (user?.role === 'ADMIN' || user?.role === 'OWNER') {
      fetchCompany()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/settings/profile')
      if (!response.ok) throw new Error('Error al cargar perfil')
      const data = await response.json()
      setProfile({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchCompany = async () => {
    try {
      const response = await fetch('/api/settings/company')
      if (!response.ok) throw new Error('Error al cargar empresa')
      const data = await response.json()
      setCompany({
        name: data.name || '',
        address: data.address || '',
        postalAddress: data.postalAddress || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        logo: data.logo || '',
        taxRate: data.taxRate || 11.5
      })
    } catch (error) {
      console.error('Error fetching company:', error)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar perfil')
      }

      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setMessage({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el logo')
      }

      // Update company state with new logo URL
      setCompany({ ...company, logo: data.url })
      setMessage({ type: 'success', text: 'Logo subido y guardado exitosamente' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCompanySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(company)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar empresa')
      }

      setMessage({ type: 'success', text: 'Información de empresa actualizada exitosamente' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    // Validate passwords match
    if (password.newPassword !== password.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' })
      setLoading(false)
      return
    }

    // Validate password length
    if (password.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(password)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña')
      }

      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' })
      // Clear password fields
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const renderProfileTab = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre
          </label>
          <input
            type="text"
            value={profile.firstName}
            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apellido
          </label>
          <input
            type="text"
            value={profile.lastName}
            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )

  const renderCompanyTab = () => (
    <form onSubmit={handleCompanySubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            value={company.name}
            onChange={(e) => setCompany({ ...company, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tasa de IVU (%)
          </label>
          <input
            type="number"
            value={company.taxRate}
            onChange={(e) => setCompany({ ...company, taxRate: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            min="0"
            max="100"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta tasa se aplicará en cotizaciones y facturas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={company.phone}
            onChange={(e) => setCompany({ ...company, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={company.email}
            onChange={(e) => setCompany({ ...company, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sitio Web
          </label>
          <input
            type="url"
            value={company.website}
            onChange={(e) => setCompany({ ...company, website: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="https://www.ejemplo.com"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección Física
          </label>
          <textarea
            value={company.address}
            onChange={(e) => setCompany({ ...company, address: e.target.value })}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Calle, Número, Colonia, Ciudad, Estado, CP"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección Postal
          </label>
          <textarea
            value={company.postalAddress}
            onChange={(e) => setCompany({ ...company, postalAddress: e.target.value })}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Apartado Postal, Casilla, o dirección para correspondencia"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo de la Empresa
          </label>
          <div className="space-y-4">
            {company.logo && (
              <div className="flex items-center gap-4">
                <img src={company.logo} alt="Logo" className="h-20 object-contain border border-gray-200 rounded-lg p-2" />
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('¿Estás seguro de que deseas remover el logo?')) {
                      try {
                        setLoading(true)
                        const response = await fetch('/api/settings/company', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...company, logo: '' })
                        })
                        if (response.ok) {
                          setCompany({ ...company, logo: '' })
                          setMessage({ type: 'success', text: 'Logo removido exitosamente' })
                        }
                      } catch (error) {
                        setMessage({ type: 'error', text: 'Error al remover el logo' })
                      } finally {
                        setLoading(false)
                      }
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remover logo
                </button>
              </div>
            )}

            <div>
              <input
                type="file"
                id="logo-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploadingLogo}
              />
              <label
                htmlFor="logo-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
                  uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingLogo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {company.logo ? 'Cambiar logo' : 'Subir logo'}
                  </>
                )}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Formatos permitidos: JPG, PNG, WEBP, GIF. Tamaño máximo: 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )

  const renderPasswordTab = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña Actual
        </label>
        <input
          type="password"
          value={password.currentPassword}
          onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nueva Contraseña
        </label>
        <input
          type="password"
          value={password.newPassword}
          onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          required
          minLength={6}
        />
        <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmar Nueva Contraseña
        </label>
        <input
          type="password"
          value={password.confirmPassword}
          onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          required
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </button>
      </div>
    </form>
  )

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-700">
          Las preferencias del sistema estarán disponibles próximamente.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Notificaciones</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" disabled />
              <span className="text-gray-500">Recibir notificaciones por email</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" disabled />
              <span className="text-gray-500">Notificaciones de nuevas cotizaciones</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" disabled />
              <span className="text-gray-500">Recordatorios de citas</span>
            </label>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Idioma y Región</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idioma
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>
                <option>Español (México)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Horaria
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>
                <option>America/Mexico_City (GMT-6)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Filter tabs based on user role
  const availableTabs = tabs.filter(tab =>
    !tab.adminOnly || (user?.role === 'ADMIN' || user?.role === 'OWNER')
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Administra tu perfil y las configuraciones del sistema
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
            : 'bg-red-50 border-l-4 border-red-500 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">{tab.icon}</span>
                  {tab.name}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'company' && renderCompanyTab()}
          {activeTab === 'password' && renderPasswordTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Backup and Export */}
          <Link
            href="/dashboard/settings/backup"
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-900 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-gray-100 text-gray-900 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Backup y Exportación</h3>
            <p className="text-sm text-gray-600">
              Descarga tus datos en formato CSV para respaldo o análisis
            </p>
          </Link>

          {/* Placeholder for future quick actions */}
          <div className="border border-gray-200 border-dashed rounded-lg p-4 opacity-50">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-gray-100 text-gray-400 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <h3 className="font-semibold text-gray-500 mb-1">Próximamente</h3>
            <p className="text-sm text-gray-400">
              Más funciones estarán disponibles pronto
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}