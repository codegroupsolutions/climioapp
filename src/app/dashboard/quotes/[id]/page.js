'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateQuotePDF } from '@/utils/generateQuotePDF'
import { useAlert } from '@/components/CustomAlert'

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({
    email: '',
    message: 'Adjunto encontrará la cotización solicitada. Quedamos a su disposición para cualquier consulta.',
  })
  const { showAlert, AlertComponent } = useAlert()

  useEffect(() => {
    fetchQuote()
  }, [params.id])

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setQuote(data)
      } else {
        router.push('/dashboard/quotes')
      }
    } catch (error) {
      console.error('Error fetching quote:', error)
      router.push('/dashboard/quotes')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`¿Estás seguro de cambiar el estado a ${getStatusLabel(newStatus)}?`)) {
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuote({ ...quote, status: newStatus })

        // If accepted, offer to create invoice
        if (newStatus === 'ACCEPTED') {
          if (confirm('¿Deseas crear una factura a partir de esta cotización?')) {
            router.push(`/dashboard/invoices/new?quoteId=${params.id}`)
          }
        }
      } else {
        const data = await response.json()
        showAlert(data.error || 'Error al actualizar el estado', 'error')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showAlert('Error al actualizar el estado', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cotización?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/quotes')
      } else {
        const data = await response.json()
        showAlert(data.error, 'error')
      }
    } catch (error) {
      console.error('Error deleting quote:', error)
      showAlert('Error al eliminar la cotización', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    if (!confirm('¿Deseas duplicar esta cotización?')) {
      return
    }

    setDuplicating(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/quotes/${data.quote.id}`)
      } else {
        const data = await response.json()
        showAlert(data.error || 'Error al duplicar la cotización', 'error')
      }
    } catch (error) {
      console.error('Error duplicating quote:', error)
      showAlert('Error al duplicar la cotización', 'error')
    } finally {
      setDuplicating(false)
    }
  }

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true)
    try {
      const doc = await generateQuotePDF(quote)
      doc.save(`${quote.number}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      showAlert('Error al generar el PDF', 'error')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailForm),
      })

      const data = await response.json()

      if (response.ok) {
        showAlert(data.message, 'success')
        setShowEmailModal(false)
        // Refresh quote to get updated status
        fetchQuote()
      } else {
        showAlert(data.error || 'Error al enviar la cotización', 'error')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      showAlert('Error al enviar la cotización', 'error')
    } finally {
      setSendingEmail(false)
    }
  }

  const openEmailModal = () => {
    setEmailForm(prev => ({
      ...prev,
      email: quote.client?.email || '',
    }))
    setShowEmailModal(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-PR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: 'Borrador',
      SENT: 'Enviada',
      ACCEPTED: 'Aceptada',
      REJECTED: 'Rechazada',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cotización no encontrada</p>
        <Link href="/dashboard/quotes" className="text-black hover:underline mt-2 inline-block">
          Volver a cotizaciones
        </Link>
      </div>
    )
  }

  const discountAmount = quote.discount || 0

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Link href="/dashboard/quotes" className="hover:text-gray-700">
            Cotizaciones
          </Link>
          <span className="mx-2">/</span>
          <span>{quote.number}</span>
        </div>

        {/* Title and badges */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{quote.number}</h1>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(quote.status)}`}>
              {getStatusLabel(quote.status)}
            </span>
          </div>

          {/* Primary Actions - Desktop */}
          <div className="hidden lg:flex flex-wrap gap-2">
            {/* Status Actions */}
            {quote.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusChange('SENT')}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {updating ? 'Procesando...' : 'Marcar Enviada'}
              </button>
            )}
            {quote.status === 'SENT' && (
              <>
                <button
                  onClick={() => handleStatusChange('ACCEPTED')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aceptada
                </button>
                <button
                  onClick={() => handleStatusChange('REJECTED')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Rechazada
                </button>
              </>
            )}
            {quote.status === 'ACCEPTED' && !quote.invoice && (
              <button
                onClick={() => router.push(`/dashboard/invoices/new?quoteId=${quote.id}`)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Crear Factura
              </button>
            )}

            {/* Other Actions */}
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPDF ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {generatingPDF ? 'Generando...' : 'PDF'}
            </button>
            <button
              onClick={openEmailModal}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enviar Email
            </button>
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {duplicating ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {duplicating ? 'Duplicando...' : 'Duplicar'}
            </button>
            {(quote.status === 'DRAFT' || quote.status === 'SENT') && (
              <>
                <Link
                  href={`/dashboard/quotes/${quote.id}/edit`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="lg:hidden grid grid-cols-2 gap-2">
          {quote.status === 'DRAFT' && (
            <>
              <button
                onClick={() => handleStatusChange('SENT')}
                disabled={updating}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {updating ? 'Procesando...' : 'Enviada'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {generatingPDF ? 'Generando...' : 'PDF'}
              </button>
              <button
                onClick={openEmailModal}
                className="px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
              <Link
                href={`/dashboard/quotes/${quote.id}/edit`}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {duplicating ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {duplicating ? 'Duplicando...' : 'Duplicar'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </>
          )}
          {quote.status === 'SENT' && (
            <>
              <button
                onClick={() => handleStatusChange('ACCEPTED')}
                disabled={updating}
                className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aceptada
              </button>
              <button
                onClick={() => handleStatusChange('REJECTED')}
                disabled={updating}
                className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rechazada
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {generatingPDF ? 'Generando...' : 'PDF'}
              </button>
              <button
                onClick={openEmailModal}
                className="px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
              <Link
                href={`/dashboard/quotes/${quote.id}/edit`}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </>
          )}
          {quote.status === 'ACCEPTED' && (
            <>
              {!quote.invoice && (
                <button
                  onClick={() => router.push(`/dashboard/invoices/new?quoteId=${quote.id}`)}
                  className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 col-span-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Crear Factura
                </button>
              )}
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {generatingPDF ? 'Generando...' : 'PDF'}
              </button>
              <button
                onClick={openEmailModal}
                className="px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
              >
                {duplicating ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {duplicating ? 'Duplicando...' : 'Duplicar Cotización'}
              </button>
            </>
          )}
          {quote.status === 'REJECTED' && (
            <>
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {generatingPDF ? 'Generando...' : 'PDF'}
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {duplicating ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {duplicating ? 'Duplicando...' : 'Duplicar'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-medium text-gray-900">
                  {quote.client?.firstName} {quote.client?.lastName}
                </p>
              </div>
              {quote.client?.companyName && (
                <div>
                  <p className="text-sm text-gray-600">Empresa</p>
                  <p className="font-medium text-gray-900">{quote.client.companyName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium text-gray-900">{quote.client?.phone}</p>
              </div>
              {quote.client?.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{quote.client.email}</p>
                </div>
              )}
              {quote.client?.address && (
                <div className="col-span-1 md:col-span-2">
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-medium text-gray-900">
                    {quote.client.address}
                    {quote.client?.city && quote.client?.state && `, ${quote.client.city}, ${quote.client.state}`}
                    {quote.client?.zipCode && ` CP ${quote.client.zipCode}`}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href={`/dashboard/clients/${quote.client?.id}`}
                className="text-black hover:underline text-sm font-medium"
              >
                Ver perfil del cliente →
              </Link>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conceptos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Descripción
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quote.items?.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.description}
                        {item.product && (
                          <span className="text-xs text-gray-500 block">
                            Código: {item.product.code}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(quote.subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVU:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(quote.tax)}</span>
                </div>
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total:</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quote Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Número</dt>
                <dd className="font-medium text-gray-900">{quote.number}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Fecha</dt>
                <dd className="font-medium text-gray-900">{formatDate(quote.date)}</dd>
              </div>
              {quote.validUntil && (
                <div>
                  <dt className="text-sm text-gray-600">Válida hasta</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDate(quote.validUntil)}
                    {new Date(quote.validUntil) < new Date() && (
                      <p className="text-xs text-red-600 mt-1">Cotización vencida</p>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-600">Creada por</dt>
                <dd className="font-medium text-gray-900">
                  {quote.user?.firstName} {quote.user?.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Estado</dt>
                <dd>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                    {getStatusLabel(quote.status)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Related Invoice */}
          {quote.invoice && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Factura Relacionada</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Número</p>
                  <p className="font-medium text-gray-900">{quote.invoice.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    quote.invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    quote.invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                    quote.invoice.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {quote.invoice.status === 'PAID' ? 'Pagada' :
                     quote.invoice.status === 'OVERDUE' ? 'Vencida' :
                     quote.invoice.status === 'CANCELLED' ? 'Cancelada' :
                     'Pendiente'}
                  </span>
                </div>
                <Link
                  href={`/dashboard/invoices/${quote.invoice.id}`}
                  className="block text-center px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  Ver Factura
                </Link>
              </div>
            </div>
          )}

          {/* Company Info */}
          {quote.company && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de Empresa</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-600">Empresa</dt>
                  <dd className="font-medium text-gray-900">{quote.company?.name}</dd>
                </div>
                {quote.company?.address && (
                  <div>
                    <dt className="text-gray-600">Dirección</dt>
                    <dd className="text-gray-900">
                      {quote.company.address}
                      {quote.company?.city && quote.company?.state && (
                        <span className="block">
                          {quote.company.city}, {quote.company.state}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowEmailModal(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Enviar Cotización por Email</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email del destinatario *
                    </label>
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      placeholder="cliente@ejemplo.com"
                    />
                    {quote.client?.email && (
                      <p className="mt-1 text-xs text-gray-500">
                        Email del cliente: {quote.client.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      value={emailForm.message}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      placeholder="Mensaje adicional..."
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p><strong>Cotización:</strong> {quote.number}</p>
                    <p><strong>Cliente:</strong> {quote.client?.firstName} {quote.client?.lastName}</p>
                    <p><strong>Total:</strong> {formatCurrency(quote.total)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!emailForm.email || sendingEmail}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingEmail && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {sendingEmail ? 'Enviando...' : 'Enviar Cotización'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="mt-3 w-full inline-flex justify-center px-4 py-2 border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AlertComponent />
    </div>
  )
}
