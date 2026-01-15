'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function ReportsPage() {
  const router = useRouter()
  const [activeReport, setActiveReport] = useState('sales')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all',
    categoryId: '',
    technicianId: '',
    groupBy: 'month'
  })

  const reportTypes = [
    { id: 'sales', name: 'Ventas', icon: '📊', description: 'Cotizaciones, facturas y conversiones' },
    { id: 'financial', name: 'Financiero', icon: '💰', description: 'Ingresos, pagos y cuentas por cobrar' },
    { id: 'inventory', name: 'Inventario', icon: '📦', description: 'Stock, movimientos y alertas' },
    { id: 'services', name: 'Servicios', icon: '🔧', description: 'Citas y rendimiento de técnicos' }
  ]

  useEffect(() => {
    fetchReport()
  }, [activeReport, filters])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.type && { type: filters.type }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.technicianId && { technicianId: filters.technicianId }),
        ...(filters.groupBy && { groupBy: filters.groupBy })
      })

      const response = await fetch(`/api/reports/${activeReport}?${params}`)
      if (!response.ok) throw new Error('Error al cargar reporte')

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF({
      format: 'letter',
      orientation: 'portrait',
      unit: 'mm'
    })
    const reportTitle = reportTypes.find(r => r.id === activeReport)?.name || 'Reporte'

    // Title
    doc.setFontSize(20)
    doc.text(`Reporte de ${reportTitle}`, 14, 22)

    // Period
    doc.setFontSize(10)
    doc.text(`Período: ${filters.startDate} al ${filters.endDate}`, 14, 30)

    let yPosition = 40

    if (activeReport === 'sales' && reportData) {
      // Sales Report
      doc.setFontSize(14)
      doc.text('Resumen de Ventas', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.text(`Cotizaciones: ${reportData.quotes?.total || 0}`, 14, yPosition)
      yPosition += 6
      doc.text(`Monto cotizado: ${formatCurrency(reportData.quotes?.totalAmount || 0)}`, 14, yPosition)
      yPosition += 6
      doc.text(`Facturas: ${reportData.invoices?.total || 0}`, 14, yPosition)
      yPosition += 6
      doc.text(`Monto facturado: ${formatCurrency(reportData.invoices?.totalAmount || 0)}`, 14, yPosition)
      yPosition += 6
      doc.text(`Tasa de conversión: ${reportData.summary?.quotesConverted || 0}%`, 14, yPosition)
      yPosition += 15

      // Top Products Table
      if (reportData.quotes?.topProducts?.length > 0) {
        doc.setFontSize(12)
        doc.text('Productos Más Cotizados', 14, yPosition)
        yPosition += 10

        doc.autoTable({
          startY: yPosition,
          head: [['Producto', 'Código', 'Cantidad', 'Total']],
          body: reportData.quotes.topProducts.map(p => [
            p.product.name,
            p.product.code,
            p.quantity,
            formatCurrency(p.total)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [0, 0, 0] }
        })
      }
    } else if (activeReport === 'financial' && reportData) {
      // Financial Report
      doc.setFontSize(14)
      doc.text('Resumen Financiero', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.text(`Ingresos totales: ${formatCurrency(reportData.revenue?.total || 0)}`, 14, yPosition)
      yPosition += 6
      doc.text(`Facturado: ${formatCurrency(reportData.revenue?.invoiced || 0)}`, 14, yPosition)
      yPosition += 6
      doc.text(`Pendiente de cobro: ${formatCurrency(reportData.revenue?.pending || 0)}`, 14, yPosition)
      yPosition += 6
      doc.text(`Tasa de cobro: ${reportData.revenue?.collectionRate || 0}%`, 14, yPosition)
      yPosition += 15

      // Payment Methods
      if (reportData.cashFlow?.income?.byMethod?.length > 0) {
        doc.setFontSize(12)
        doc.text('Métodos de Pago', 14, yPosition)
        yPosition += 10

        doc.autoTable({
          startY: yPosition,
          head: [['Método', 'Transacciones', 'Total', '%']],
          body: reportData.cashFlow.income.byMethod.map(m => [
            m.method,
            m.count,
            formatCurrency(m.total),
            `${m.percentage}%`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [0, 0, 0] }
        })
      }
    } else if (activeReport === 'inventory' && reportData) {
      // Inventory Report
      doc.setFontSize(14)
      doc.text('Resumen de Inventario', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.text(`Productos totales: ${reportData.currentStock?.totalProducts || 0}`, 14, yPosition)
      yPosition += 6
      doc.text(`Items en stock: ${reportData.currentStock?.totalItems || 0}`, 14, yPosition)
      yPosition += 6
      doc.text(`Valor total: ${formatCurrency(reportData.currentStock?.totalValue || 0)}`, 14, yPosition)
      yPosition += 6
      doc.text(`Productos con stock bajo: ${reportData.alerts?.lowStock?.count || 0}`, 14, yPosition)
      yPosition += 6
      doc.text(`Productos sin stock: ${reportData.alerts?.outOfStock?.count || 0}`, 14, yPosition)
      yPosition += 15

      // Low Stock Alert
      if (reportData.alerts?.lowStock?.products?.length > 0) {
        doc.setFontSize(12)
        doc.text('Alertas de Stock Bajo', 14, yPosition)
        yPosition += 10

        doc.autoTable({
          startY: yPosition,
          head: [['Producto', 'Código', 'Stock', 'Mínimo']],
          body: reportData.alerts.lowStock.products.slice(0, 10).map(p => [
            p.name,
            p.code,
            p.stock,
            p.minStock
          ]),
          theme: 'striped',
          headStyles: { fillColor: [0, 0, 0] }
        })
      }
    } else if (activeReport === 'services' && reportData) {
      // Services Report
      doc.setFontSize(14)
      doc.text('Resumen de Servicios', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.text(`Citas totales: ${reportData.appointments?.total || 0}`, 14, yPosition)
      yPosition += 6
      doc.text(`Completadas: ${reportData.appointments?.completed || 0}`, 14, yPosition)
      yPosition += 6
      doc.text(`Tasa de completación: ${reportData.appointments?.completionRate || 0}%`, 14, yPosition)
      yPosition += 6
      doc.text(`Duración promedio: ${reportData.appointments?.averageDuration || 0} minutos`, 14, yPosition)
      yPosition += 6
      doc.text(`Técnicos activos: ${reportData.technicians?.active || 0}`, 14, yPosition)
      yPosition += 15

      // Technician Performance
      if (reportData.technicians?.performance?.length > 0) {
        doc.setFontSize(12)
        doc.text('Rendimiento de Técnicos', 14, yPosition)
        yPosition += 10

        doc.autoTable({
          startY: yPosition,
          head: [['Técnico', 'Total', 'Completadas', 'Tasa de Completación']],
          body: reportData.technicians.performance.slice(0, 10).map(t => [
            t.name,
            t.totalAppointments,
            t.completed,
            `${t.completionRate}%`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [0, 0, 0] }
        })
      }
    }

    // Save PDF
    doc.save(`reporte-${activeReport}-${filters.startDate}-${filters.endDate}.pdf`)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-PR').format(num)
  }

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: 'Borrador',
      SENT: 'Enviada',
      ACCEPTED: 'Aceptada',
      REJECTED: 'Rechazada',
      EXPIRED: 'Expirada',
      PENDING: 'Pendiente',
      PAID: 'Pagada',
      CANCELLED: 'Cancelada',
      SCHEDULED: 'Programada',
      IN_PROGRESS: 'En Proceso',
      COMPLETED: 'Completada'
    }
    return labels[status] || status
  }

  const renderSalesReport = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Cotizaciones</p>
            <p className="text-2xl font-bold">{reportData.quotes?.total || 0}</p>
            <p className="text-sm text-gray-500">{formatCurrency(reportData.quotes?.totalAmount || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Facturas</p>
            <p className="text-2xl font-bold">{reportData.invoices?.total || 0}</p>
            <p className="text-sm text-gray-500">{formatCurrency(reportData.invoices?.totalAmount || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Ingresos</p>
            <p className="text-2xl font-bold">{formatCurrency(reportData.invoices?.totalPaid || 0)}</p>
            <p className="text-sm text-gray-500">Pagado</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Pendiente</p>
            <p className="text-2xl font-bold">{formatCurrency(reportData.invoices?.totalPending || 0)}</p>
            <p className="text-sm text-gray-500">Por cobrar</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Conversión</p>
            <p className="text-2xl font-bold">{reportData.summary?.quotesConverted || 0}%</p>
            <p className="text-sm text-gray-500">Cotizaciones a facturas</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quotes by Status */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Cotizaciones por Estado</h3>
            {reportData.quotes?.byStatus?.length > 0 ? (
              <div className="space-y-2">
                {reportData.quotes.byStatus.map((stat) => (
                  <div key={stat.status} className="flex justify-between items-center">
                    <span className="text-sm">{getStatusLabel(stat.status)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stat.count}</span>
                      <span className="text-xs text-gray-500">({formatCurrency(stat.total)})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>

          {/* Invoices by Status */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Facturas por Estado</h3>
            {reportData.invoices?.byStatus?.length > 0 ? (
              <div className="space-y-2">
                {reportData.invoices.byStatus.map((stat) => (
                  <div key={stat.status} className="flex justify-between items-center">
                    <span className="text-sm">{getStatusLabel(stat.status)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stat.count}</span>
                      <span className="text-xs text-gray-500">({formatCurrency(stat.total)})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        {reportData.quotes?.topProducts?.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Productos Más Cotizados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.quotes.topProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm">{product.product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.product.code}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatNumber(product.quantity)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(product.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderFinancialReport = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Ingresos Total</p>
            <p className="text-2xl font-bold">{formatCurrency(reportData.revenue?.total || 0)}</p>
            <p className="text-sm text-gray-500">Cobrado</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Facturado</p>
            <p className="text-2xl font-bold">{formatCurrency(reportData.revenue?.invoiced || 0)}</p>
            <p className="text-sm text-gray-500">Total facturado</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Por Cobrar</p>
            <p className="text-2xl font-bold">{formatCurrency(reportData.revenue?.pending || 0)}</p>
            <p className="text-sm text-gray-500">Pendiente</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Tasa de Cobro</p>
            <p className="text-2xl font-bold">{reportData.revenue?.collectionRate || 0}%</p>
            <p className="text-sm text-gray-500">Eficiencia</p>
          </div>
        </div>

        {/* Payment Methods and Aging */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Métodos de Pago</h3>
            {reportData.cashFlow?.income?.byMethod?.length > 0 ? (
              <div className="space-y-2">
                {reportData.cashFlow.income.byMethod.map((method) => (
                  <div key={method.method} className="flex justify-between items-center">
                    <span className="text-sm">{method.method}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(method.total)}</span>
                      <span className="text-xs text-gray-500">({method.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>

          {/* Accounts Aging */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Antigüedad de Saldos</h3>
            {reportData.accounts?.receivable?.aging ? (
              <div className="space-y-2">
                {Object.entries(reportData.accounts.receivable.aging).map(([period, data]) => (
                  <div key={period} className="flex justify-between items-center">
                    <span className="text-sm">{period} días</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(data.total)}</span>
                      <span className="text-xs text-gray-500">({data.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>
        </div>

        {/* Top Clients Table */}
        {reportData.accounts?.topClients?.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Principales Clientes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Transacciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.accounts.topClients.map((client, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm">{client.name}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(client.revenue)}</td>
                      <td className="px-6 py-4 text-sm text-right">{client.transactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overdue Invoices */}
        {reportData.accounts?.receivable?.overdue?.invoices?.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-red-600">Facturas Vencidas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Número</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Días Vencido</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.accounts.receivable.overdue.invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{invoice.number}</td>
                      <td className="px-6 py-4 text-sm">{invoice.client}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatCurrency(invoice.total)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(invoice.pending)}</td>
                      <td className="px-6 py-4 text-sm text-right text-red-600">{invoice.daysOverdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderInventoryReport = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Productos</p>
            <p className="text-2xl font-bold">{formatNumber(reportData.currentStock?.totalProducts || 0)}</p>
            <p className="text-sm text-gray-500">En catálogo</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Items en Stock</p>
            <p className="text-2xl font-bold">{formatNumber(reportData.currentStock?.totalItems || 0)}</p>
            <p className="text-sm text-gray-500">Unidades</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-2xl font-bold">{formatCurrency(reportData.currentStock?.totalValue || 0)}</p>
            <p className="text-sm text-gray-500">Inventario</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Stock Bajo</p>
            <p className="text-2xl font-bold text-yellow-600">{reportData.alerts?.lowStock?.count || 0}</p>
            <p className="text-sm text-gray-500">Productos</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Sin Stock</p>
            <p className="text-2xl font-bold text-red-600">{reportData.alerts?.outOfStock?.count || 0}</p>
            <p className="text-sm text-gray-500">Productos</p>
          </div>
        </div>

        {/* Categories Distribution */}
        {reportData.currentStock?.byCategory?.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Distribución por Categoría</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Productos</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock Total</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock Bajo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.currentStock.byCategory.map((cat, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-right">{cat.productCount}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatNumber(cat.totalStock)}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatCurrency(cat.totalValue)}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={cat.lowStockCount > 0 ? "text-yellow-600" : ""}>
                          {cat.lowStockCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {reportData.alerts?.lowStock?.products?.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-yellow-600">Alertas de Stock Bajo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.alerts.lowStock.products.map((product) => (
                    <tr key={product.id} className="hover:bg-yellow-50">
                      <td className="px-6 py-4 text-sm">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.code}</td>
                      <td className="px-6 py-4 text-sm">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-yellow-600">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">{product.minStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Value Products */}
        {reportData.valuation?.topValueProducts?.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Productos de Mayor Valor</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.valuation.topValueProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 text-sm">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.code}</td>
                      <td className="px-6 py-4 text-sm text-right">{product.stock}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatCurrency(product.unitPrice)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(product.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderServicesReport = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Citas Totales</p>
            <p className="text-2xl font-bold">{reportData.appointments?.total || 0}</p>
            <p className="text-sm text-gray-500">En período</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Completadas</p>
            <p className="text-2xl font-bold text-green-600">{reportData.appointments?.completed || 0}</p>
            <p className="text-sm text-gray-500">{reportData.appointments?.completionRate || 0}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Canceladas</p>
            <p className="text-2xl font-bold text-red-600">{reportData.appointments?.cancelled || 0}</p>
            <p className="text-sm text-gray-500">{reportData.appointments?.cancellationRate || 0}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Duración Promedio</p>
            <p className="text-2xl font-bold">{reportData.appointments?.averageDuration || 0}</p>
            <p className="text-sm text-gray-500">minutos</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Técnicos Activos</p>
            <p className="text-2xl font-bold">{reportData.technicians?.active || 0}</p>
            <p className="text-sm text-gray-500">Con citas</p>
          </div>
        </div>

        {/* Service Types and Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Types */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Tipos de Servicio</h3>
            {reportData.services?.byType?.length > 0 ? (
              <div className="space-y-2">
                {reportData.services.byType.map((type) => (
                  <div key={type.type} className="flex justify-between items-center">
                    <span className="text-sm">{type.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{type.count}</span>
                      <span className="text-xs text-gray-500">({type.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>

          {/* Appointment Status */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Estado de Citas</h3>
            {reportData.appointments?.byStatus?.length > 0 ? (
              <div className="space-y-2">
                {reportData.appointments.byStatus.map((stat) => (
                  <div key={stat.status} className="flex justify-between items-center">
                    <span className="text-sm">{getStatusLabel(stat.status)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stat.count}</span>
                      <span className="text-xs text-gray-500">({stat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>
        </div>

        {/* Technician Performance */}
        {reportData.technicians?.performance?.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Rendimiento de Personal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Completadas</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Canceladas</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tasa Completación</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.technicians.performance.map((tech) => (
                    <tr key={tech.id}>
                      <td className="px-6 py-4 text-sm font-medium">{tech.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tech.role}</td>
                      <td className="px-6 py-4 text-sm text-right">{tech.totalAppointments}</td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">{tech.completed}</td>
                      <td className="px-6 py-4 text-sm text-right text-red-600">{tech.cancelled}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">{tech.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Clients */}
        {reportData.performance?.clientSatisfaction?.topClients?.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Clientes Principales</h3>
              <p className="text-sm text-gray-500 mt-1">
                Tasa de clientes recurrentes: {reportData.performance.clientSatisfaction.repeatRate}%
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Citas</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Completadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.performance.clientSatisfaction.topClients.map((client, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm">{client.name}</td>
                      <td className="px-6 py-4 text-sm text-right">{client.appointments}</td>
                      <td className="px-6 py-4 text-sm text-right">{client.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">Análisis y métricas de tu negocio</p>
        </div>
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="flex overflow-x-auto">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveReport(type.id)}
              className={`px-6 py-4 border-b-2 transition-colors min-w-fit ${
                activeReport === type.id
                  ? 'border-black text-black bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{type.icon}</span>
                <div className="text-left">
                  <p className="font-medium">{type.name}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          {activeReport === 'financial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agrupar Por
              </label>
              <select
                value={filters.groupBy}
                onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </div>
          )}
          {activeReport === 'sales' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Todos</option>
                <option value="quotes">Solo Cotizaciones</option>
                <option value="invoices">Solo Facturas</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div>
          {activeReport === 'sales' && renderSalesReport()}
          {activeReport === 'financial' && renderFinancialReport()}
          {activeReport === 'inventory' && renderInventoryReport()}
          {activeReport === 'services' && renderServicesReport()}
        </div>
      )}
    </div>
  )
}