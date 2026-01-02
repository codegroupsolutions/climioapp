'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BackupPage() {
  const [exporting, setExporting] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const exportOptions = [
    {
      id: 'clients',
      title: 'Clientes',
      description: 'Exportar todos los clientes registrados',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'products',
      title: 'Productos',
      description: 'Exportar catálogo de productos e inventario',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'quotes',
      title: 'Cotizaciones',
      description: 'Exportar todas las cotizaciones',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'invoices',
      title: 'Facturas',
      description: 'Exportar todas las facturas y pagos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      ),
    },
    {
      id: 'appointments',
      title: 'Citas',
      description: 'Exportar calendario de citas',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'inventory',
      title: 'Movimientos de Inventario',
      description: 'Exportar historial de movimientos de inventario',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
    },
  ]

  const handleExport = async (type) => {
    setExporting(prev => ({ ...prev, [type]: true }))
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/export/${type}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al exportar datos')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${type}_${new Date().toISOString().split('T')[0]}.csv`

      if (contentDisposition) {
        // Match filename with or without quotes
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          // Remove quotes if present
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Convert response to blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess(`Datos de ${exportOptions.find(o => o.id === type)?.title} exportados correctamente`)
    } catch (err) {
      console.error('Error exporting:', err)
      setError(err.message || 'Error al exportar datos')
    } finally {
      setExporting(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleExportAll = async () => {
    setExporting({ all: true })
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/export/all')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al exportar datos')
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `backup_completo_${new Date().toISOString().split('T')[0]}.zip`

      if (contentDisposition) {
        // Match filename with or without quotes
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          // Remove quotes if present
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Download ZIP file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess('Backup completo exportado correctamente')
    } catch (err) {
      console.error('Error exporting all:', err)
      setError(err.message || 'Error al exportar datos')
    } finally {
      setExporting({ all: false })
    }
  }

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/dashboard/settings" className="hover:text-gray-700">
            Configuración
          </Link>
          <span className="mx-2">/</span>
          <span>Backup y Exportación</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Backup y Exportación de Datos</h1>
        <p className="text-gray-600 mt-1">
          Exporta tus datos en formato CSV para respaldo o análisis
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Export All Section */}
      <div className="bg-white border-2 border-gray-900 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Exportación Completa</h2>
            <p className="text-gray-600">
              Descarga todos tus datos en un archivo ZIP con archivos CSV separados
            </p>
          </div>
          <button
            onClick={handleExportAll}
            disabled={exporting.all}
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting.all ? 'Exportando...' : 'Exportar Todo'}
          </button>
        </div>
      </div>

      {/* Individual Export Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Exportación Individual</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportOptions.map((option) => (
            <div
              key={option.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-900 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-gray-100 text-gray-900 rounded-lg">
                  {option.icon}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{option.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>
              <button
                onClick={() => handleExport(option.id)}
                disabled={exporting[option.id]}
                className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exporting[option.id] ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-gray-700 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Información sobre el backup</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Los archivos CSV se pueden abrir con Excel, Google Sheets o cualquier editor de texto</li>
              <li>Los datos exportados incluyen toda la información visible en el sistema</li>
              <li>El backup completo incluye todos los módulos en archivos separados dentro de un ZIP</li>
              <li>Los datos son exportados en tiempo real, reflejando el estado actual de tu información</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
