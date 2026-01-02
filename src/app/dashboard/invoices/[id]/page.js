'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateInvoicePDF } from '@/utils/generateInvoicePDF'
import { formatDateForInput, getTodayInputDate } from '@/utils/dateUtils'
import { useAuth } from '@/hooks/useAuth'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({ email: '' })
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH',
    paidAt: getTodayInputDate(),
    notes: '',
  })

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setInvoice(data)
        // Set remaining balance as default payment amount
        const balance = (data.total || 0) - (data.paidAmount || 0)
        setPaymentForm(prev => ({ ...prev, amount: balance.toFixed(2) }))
      } else {
        router.push('/dashboard/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      router.push('/dashboard/invoices')
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
      const response = await fetch(`/api/invoices/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        setInvoice({ ...invoice, status: newStatus, ...(newStatus === 'PAID' && { paidAmount: invoice.total }) })
        alert(data.message || 'Estado actualizado correctamente')
      } else {
        const data = await response.json()
        alert(data.error || 'Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar el estado')
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentSubmit = async () => {
    const paymentAmount = parseFloat(paymentForm.amount)

    if (!paymentForm.amount || paymentAmount <= 0) {
      alert('El monto del pago debe ser mayor a 0')
      return
    }

    const balance = (invoice.total || 0) - (invoice.paidAmount || 0)
    // Add small tolerance for floating-point comparison
    const tolerance = 0.01

    if (paymentAmount > balance + tolerance) {
      alert(`El pago excede el saldo pendiente de ${formatCurrency(balance)}`)
      return
    }

    try {
      const response = await fetch(`/api/invoices/${params.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentForm),
      })

      const data = await response.json()

      if (response.ok) {
        setInvoice(data.invoice)
        setShowPaymentModal(false)
        alert('Pago registrado exitosamente')
        // Reset form
        const newBalance = (data.invoice.total || 0) - (data.invoice.paidAmount || 0)
        setPaymentForm({
          amount: newBalance.toFixed(2),
          method: 'CASH',
          paidAt: getTodayInputDate(),
          notes: '',
        })
      } else {
        alert(data.error || 'Error al registrar el pago')
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Error al registrar el pago')
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      return
    }

    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/invoices')
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Error al eliminar la factura')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const doc = await generateInvoicePDF(invoice)
      doc.save(`${invoice.number}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF')
    }
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      const response = await fetch(`/api/invoices/${params.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailForm.email }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'Factura enviada exitosamente')
        setShowEmailModal(false)
      } else {
        alert(data.error || 'Error al enviar la factura')
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      alert('Error al enviar la factura')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleEditClick = (e) => {
    // If invoice is paid and user is admin, show confirmation
    if (invoice.status === 'PAID') {
      if (!confirm('Esta factura ya está pagada. ¿Desea editarla de todos modos?')) {
        e.preventDefault()
        return false
      }
    }
    return true
  }

  const openEmailModal = () => {
    setEmailForm({ email: invoice.client?.email || '' })
    setShowEmailModal(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return '-';

    // Extraer la fecha sin conversión de timezone
    const dateStr = formatDateForInput(date); // YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);

    // Crear fecha local para formatear
    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString('es-PR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    // Check if overdue - comparar fechas sin timezone
    if (status === 'PENDING' && invoice?.dueDate) {
      const dueDateStr = formatDateForInput(invoice.dueDate);
      const todayStr = getTodayInputDate();
      if (dueDateStr < todayStr) {
        return 'bg-red-100 text-red-800'
      }
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Pendiente',
      PAID: 'Pagada',
      CANCELLED: 'Cancelada',
    }
    // Check if overdue - comparar fechas sin timezone
    if (status === 'PENDING' && invoice?.dueDate) {
      const dueDateStr = formatDateForInput(invoice.dueDate);
      const todayStr = getTodayInputDate();
      if (dueDateStr < todayStr) {
        return 'Vencida'
      }
    }
    return labels[status] || status
  }

  const getTypeLabel = (type) => {
    const labels = {
      SERVICE: 'Servicio',
      EQUIPMENT: 'Equipo',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Factura no encontrada</p>
        <Link href="/dashboard/invoices" className="text-black hover:underline mt-2 inline-block">
          Volver a facturas
        </Link>
      </div>
    )
  }

  const balance = (invoice.total || 0) - (invoice.paidAmount || 0)

  // Check if overdue - comparar fechas sin timezone
  const isOverdue = invoice.status === 'PENDING' && invoice.dueDate && (() => {
    const dueDateStr = formatDateForInput(invoice.dueDate);
    const todayStr = getTodayInputDate();
    return dueDateStr < todayStr;
  })()

  const currentStatus = isOverdue ? 'OVERDUE' : invoice.status

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Link href="/dashboard/invoices" className="hover:text-gray-700">
            Facturas
          </Link>
          <span className="mx-2">/</span>
          <span>{invoice.number}</span>
        </div>

        {/* Title and badges */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{invoice.number}</h1>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(currentStatus)}`}>
              {getStatusLabel(currentStatus)}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {getTypeLabel(invoice.type)}
            </span>
          </div>

          {/* Primary Actions - Desktop */}
          <div className="hidden lg:flex flex-wrap gap-2">
            {/* Status Actions */}
            {invoice.status === 'PENDING' && (
              <>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Pago
                </button>
                <button
                  onClick={() => handleStatusChange('PAID')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Marcar Pagada
                </button>
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={updating}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
              </>
            )}
            {invoice.status === 'CANCELLED' && (
              <button
                onClick={() => handleStatusChange('PENDING')}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reactivar
              </button>
            )}

            {/* Other Actions */}
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
            {/* Send Email - Admin only */}
            {isAdmin && (
              <button
                onClick={openEmailModal}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Enviar Email
              </button>
            )}
            {/* Edit - PENDING or ADMIN */}
            {(invoice.status === 'PENDING' || isAdmin) && (
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                onClick={handleEditClick}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
            )}
            {invoice.status !== 'PAID' && (!invoice.payments || invoice.payments.length === 0) && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="lg:hidden grid grid-cols-2 gap-2">
          {invoice.status === 'PENDING' && (
            <>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Registrar Pago
              </button>
              <button
                onClick={() => handleStatusChange('PAID')}
                disabled={updating}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pagada
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                onClick={handleEditClick}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
              {isAdmin && (
                <button
                  onClick={openEmailModal}
                  className="px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 col-span-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Enviar Email
                </button>
              )}
            </>
          )}
          {invoice.status === 'CANCELLED' && (
            <>
              <button
                onClick={() => handleStatusChange('PENDING')}
                disabled={updating}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 col-span-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reactivar Factura
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
            </>
          )}
          {invoice.status === 'PAID' && (
            <>
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={openEmailModal}
                    className="px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar
                  </button>
                  <Link
                    href={`/dashboard/invoices/${invoice.id}/edit`}
                    onClick={handleEditClick}
                    className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 col-span-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </Link>
                </>
              )}
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
                  {invoice.client?.firstName || ''} {invoice.client?.lastName || ''}
                </p>
                {invoice.client?.companyName && (
                  <p className="text-sm text-gray-700">{invoice.client.companyName}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Contacto</p>
                {invoice.client?.email && (
                  <p className="text-sm text-gray-900">{invoice.client.email}</p>
                )}
                {invoice.client?.phone && (
                  <p className="text-sm text-gray-900">{invoice.client.phone}</p>
                )}
              </div>
              {invoice.client?.address && (
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="text-sm text-gray-900">{invoice.client.address}</p>
                  {invoice.client?.city && invoice.client?.state && (
                    <p className="text-sm text-gray-900">
                      {invoice.client.city}, {invoice.client.state}
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">RFC</p>
                <p className="text-sm text-gray-900">{invoice.client?.taxId || 'No registrado'}</p>
              </div>
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
                  {invoice.items?.map((item, index) => (
                    <tr key={index}>
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
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVU:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total:</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
                {invoice.status !== 'CANCELLED' && (
                  <>
                    {invoice.paidAmount > 0 && (
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-gray-600">Pagado:</span>
                        <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                      </div>
                    )}
                    {balance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-gray-900">Saldo:</span>
                        <span className="font-bold text-red-600">{formatCurrency(balance)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Pagos</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Método
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.payments.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(payment.paidAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {payment.method}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {payment.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Número</dt>
                <dd className="font-medium text-gray-900">{invoice.number}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Tipo</dt>
                <dd className="font-medium text-gray-900">{getTypeLabel(invoice.type)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Fecha</dt>
                <dd className="font-medium text-gray-900">{formatDate(invoice.date)}</dd>
              </div>
              {invoice.dueDate && (
                <div>
                  <dt className="text-sm text-gray-600">Vencimiento</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDate(invoice.dueDate)}
                    {isOverdue && (
                      <p className="text-xs text-red-600 mt-1">Factura vencida</p>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-600">Creada por</dt>
                <dd className="font-medium text-gray-900">
                  {invoice.user?.firstName || ''} {invoice.user?.lastName || ''}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Estado</dt>
                <dd>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(currentStatus)}`}>
                    {getStatusLabel(currentStatus)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Related Quote */}
          {invoice.quote && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cotización Relacionada</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Número</p>
                  <p className="font-medium text-gray-900">{invoice.quote?.number}</p>
                </div>
                <Link
                  href={`/dashboard/quotes/${invoice.quote?.id}`}
                  className="block text-center px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  Ver Cotización
                </Link>
              </div>
            </div>
          )}

          {/* Company Info */}
          {invoice.company && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de Facturación</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-600">Empresa</dt>
                  <dd className="font-medium text-gray-900">{invoice.company?.name}</dd>
                </div>
                {invoice.company?.taxId && (
                  <div>
                    <dt className="text-gray-600">RFC</dt>
                    <dd className="font-medium text-gray-900">{invoice.company.taxId}</dd>
                  </div>
                )}
                {invoice.company?.address && (
                  <div>
                    <dt className="text-gray-600">Dirección</dt>
                    <dd className="text-gray-900">
                      {invoice.company.address}
                      {invoice.company?.city && invoice.company?.state && (
                        <span className="block">
                          {invoice.company.city}, {invoice.company.state}
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowPaymentModal(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Pago</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                        min="0.01"
                        max={balance.toFixed(2)}
                        step="0.01"
                        required
                        className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        placeholder={`Máximo: ${formatCurrency(balance)}`}
                      />
                      <button
                        type="button"
                        onClick={() => setPaymentForm(prev => ({ ...prev, amount: balance.toFixed(2) }))}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                        title="Pagar saldo completo"
                      >
                        Saldo Total
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Saldo pendiente: {formatCurrency(balance)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de pago *
                    </label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    >
                      <option value="CASH">Efectivo</option>
                      <option value="CARD">Tarjeta</option>
                      <option value="TRANSFER">Transferencia</option>
                      <option value="STRIPE">Stripe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de pago
                    </label>
                    <input
                      type="date"
                      value={paymentForm.paidAt}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paidAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      placeholder="Notas adicionales..."
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={handlePaymentSubmit}
                  disabled={!paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
                  className="w-full inline-flex justify-center px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Registrar Pago
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="mt-3 w-full inline-flex justify-center px-4 py-2 border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Enviar Factura por Email</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email del destinatario *
                    </label>
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ email: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      placeholder="correo@ejemplo.com"
                    />
                    {invoice.client?.email && (
                      <p className="mt-1 text-xs text-gray-500">
                        Email del cliente: {invoice.client.email}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p><strong>Factura:</strong> {invoice.number}</p>
                    <p><strong>Cliente:</strong> {invoice.client?.firstName} {invoice.client?.lastName}</p>
                    <p><strong>Total:</strong> {formatCurrency(invoice.total)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!emailForm.email || sendingEmail}
                  className="w-full inline-flex justify-center px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingEmail ? 'Enviando...' : 'Enviar Factura'}
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
    </div>
  )
}