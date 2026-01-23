'use client'

import {useState, useEffect} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {useAuth} from '@/hooks/useAuth'
import {
    FaCalendarAlt,
    FaList,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaUser,
    FaMapMarkerAlt
} from 'react-icons/fa'
import { toPuertoRicoTime, formatPuertoRicoDate } from '@/utils/dateUtils'

export default function AppointmentsPage() {
    const router = useRouter()
    const {user} = useAuth()
    const [appointments, setAppointments] = useState([])
    const [technicians, setTechnicians] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('calendar') // 'calendar' or 'list'
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)
    const [statusFilter, setStatusFilter] = useState('')
    const [technicianFilter, setTechnicianFilter] = useState('')

    useEffect(() => {
        fetchAppointments()
    }, [currentDate, view, statusFilter, technicianFilter])

    const fetchAppointments = async () => {
        setLoading(true)
        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

            const params = new URLSearchParams({
                view,
                startDate: startOfMonth.toISOString(),
                endDate: endOfMonth.toISOString(),
                ...(statusFilter && {status: statusFilter}),
                ...(technicianFilter && {technicianId: technicianFilter}),
            })

            const response = await fetch(`/api/appointments?${params}`)
            const data = await response.json()

            if (response.ok) {
                setAppointments(data.appointments)
                if (data.technicians) {
                    setTechnicians(data.technicians)
                }
            }
        } catch (error) {
            console.error('Error fetching appointments:', error)
        } finally {
            setLoading(false)
        }
    }

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i))
        }

        return days
    }

    const getAppointmentsForDate = (date) => {
        if (!date) return []

        return appointments.filter(appointment => {
            // Convertir la fecha del appointment a timezone de Puerto Rico para comparar
            const appointmentDate = toPuertoRicoTime(appointment.startDate)
            return appointmentDate.getDate() === date.getDate() &&
                appointmentDate.getMonth() === date.getMonth() &&
                appointmentDate.getFullYear() === date.getFullYear()
        })
    }

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate)
        newDate.setMonth(currentDate.getMonth() + direction)
        setCurrentDate(newDate)
    }

    const formatTime = (dateString) => {
        return formatPuertoRicoDate(dateString, 'hh:mm a')
    }

    const formatDate = (date) => {
        return date.toLocaleDateString('es-PR', {
            year: 'numeric',
            month: 'long',
        })
    }

    const getStatusColor = (status) => {
        const colors = {
            SCHEDULED: 'bg-blue-100 text-blue-800',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
            COMPLETED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-gray-100 text-gray-800',
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status) => {
        const labels = {
            SCHEDULED: 'Programada',
            IN_PROGRESS: 'En Proceso',
            COMPLETED: 'Completada',
            CANCELLED: 'Cancelada',
        }
        return labels[status] || status
    }

    const getTypeLabel = (type) => {
        const labels = {
            SERVICE: 'Servicio',
            INSTALLATION: 'Instalación',
            MAINTENANCE: 'Mantenimiento',
            REPAIR: 'Reparación',
            INSPECTION: 'Inspección',
            CONSULTATION: 'Consulta',
        }
        return labels[type] || type
    }

    const getTypeColor = (type) => {
        const colors = {
            SERVICE: 'border-purple-500',
            INSTALLATION: 'border-green-500',
            MAINTENANCE: 'border-blue-500',
            REPAIR: 'border-red-500',
            INSPECTION: 'border-yellow-500',
            CONSULTATION: 'border-indigo-500',
        }
        return colors[type] || 'border-gray-500'
    }

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    return (
        <div className="max-w-full mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendario de Servicios</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona tus citas y servicios programados</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-3 py-1 rounded ${
                                view === 'calendar'
                                    ? 'bg-white text-black font-medium shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Calendario
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-3 py-1 rounded ${
                                view === 'list'
                                    ? 'bg-white text-black font-medium shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Lista
                        </button>
                    </div>
                    <Link
                        href="/dashboard/appointments/new"
                        className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                    >
                        Nueva Cita
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    >
                        <option value="">Todos los estados</option>
                        <option value="SCHEDULED">Programada</option>
                        <option value="IN_PROGRESS">En Proceso</option>
                        <option value="COMPLETED">Completada</option>
                        <option value="CANCELLED">Cancelada</option>
                    </select>
                    {technicians.length > 0 && user?.role !== 'TECHNICIAN' && (
                        <select
                            value={technicianFilter}
                            onChange={(e) => setTechnicianFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        >
                            <option value="">Todos los empleados</option>
                            {technicians.map(tech => (
                                <option key={tech.id} value={tech.id}>
                                    {tech.firstName} {tech.lastName}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {view === 'calendar' ? (
                // Calendar View
                <div className="bg-white rounded-lg border border-gray-200">
                    {/* Calendar Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => navigateMonth(-1)}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M15 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <h2 className="text-lg font-semibold text-gray-900 capitalize">
                                {formatDate(currentDate)}
                            </h2>
                            <button
                                onClick={() => navigateMonth(1)}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-4">
                        {/* Week days header */}
                        <div className="grid grid-cols-7 gap-0 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-0 border-l border-t border-gray-200">
                            {getDaysInMonth().map((date, index) => {
                                const dayAppointments = date ? getAppointmentsForDate(date) : []
                                const isToday = date &&
                                    date.getDate() === new Date().getDate() &&
                                    date.getMonth() === new Date().getMonth() &&
                                    date.getFullYear() === new Date().getFullYear()

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[100px] border-r border-b border-gray-200 p-2 ${
                                            date ? 'hover:bg-gray-50 cursor-pointer' : ''
                                        } ${isToday ? 'bg-blue-50' : ''}`}
                                        onClick={() => date && setSelectedDate(date)}
                                    >
                                        {date && (
                                            <>
                                                <div className="font-medium text-sm text-gray-900 mb-1">
                                                    {date.getDate()}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayAppointments.slice(0, 3).map(appointment => (
                                                        <div
                                                            key={appointment.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                router.push(`/dashboard/appointments/${appointment.id}`)
                                                            }}
                                                            className={`text-xs p-1 rounded border-l-2 ${getTypeColor(appointment.type)} bg-white hover:shadow-sm cursor-pointer truncate`}
                                                        >
                                                            <div className="font-medium truncate">
                                                                {formatTime(appointment.startDate)} - {appointment.title}
                                                            </div>
                                                            {appointment.technician && (
                                                                <div className="text-gray-500 truncate">
                                                                    {appointment.technician.firstName} {appointment.technician.lastName}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {dayAppointments.length > 3 && (
                                                        <div className="text-xs text-gray-500">
                                                            +{dayAppointments.length - 3} más
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                // List View
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha/Hora
                                </th>
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
                                    Técnico
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tareas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        <div className="flex items-center justify-center">
                                            <div
                                                className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No se encontraron citas
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((appointment) => (
                                    <tr
                                        key={appointment.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium">
                                                    {new Date(appointment.startDate).toLocaleDateString('es-PR')}
                                                </div>
                                                <div className="text-gray-500">
                                                    {formatTime(appointment.startDate)} - {formatTime(appointment.endDate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium">
                                                    {appointment.client?.firstName} {appointment.client?.lastName}
                                                </div>
                                                {appointment.client?.companyName && (
                                                    <div className="text-xs text-gray-500">
                                                        {appointment.client.companyName}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="max-w-xs">
                                                <div className="truncate">
                                                    {appointment.title}
                                                </div>
                                                {appointment.serviceContractId && (
                                                    <div className="text-xs text-blue-600 mt-1">
                                                        📄 Contrato de servicio
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                            className={`px-2 py-1 text-xs font-medium rounded border-l-2 ${getTypeColor(appointment.type)}`}>
                          {getTypeLabel(appointment.type)}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {appointment.technician ? (
                                                <div>
                                                    {appointment.technician.firstName} {appointment.technician.lastName}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {appointment.tasks && appointment.tasks.length > 0 ? (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-green-600 font-medium">
                                                        {appointment.tasks.filter(t => t.completed).length}
                                                    </span>
                                                    <span className="text-gray-400">/</span>
                                                    <span className="text-gray-600">
                                                        {appointment.tasks.length}
                                                    </span>
                                                    {appointment.tasks.filter(t => t.completed).length === appointment.tasks.length && appointment.tasks.length > 0 && (
                                                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Sin tareas</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/dashboard/appointments/${appointment.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-black hover:text-gray-700"
                                            >
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Selected Date Modal */}
            {selectedDate && (
                <div className="fixed inset-0 overflow-y-auto" style={{zIndex: 9999}}>
                    <div
                        className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true"
                             onClick={() => setSelectedDate(null)}>
                            <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"
                              aria-hidden="true">&#8203;</span>

                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Citas del {selectedDate.toLocaleDateString('es-PR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                </h3>

                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {getAppointmentsForDate(selectedDate).length === 0 ? (
                                        <p className="text-gray-500">No hay citas programadas para este día</p>
                                    ) : (
                                        getAppointmentsForDate(selectedDate).map(appointment => (
                                            <div
                                                key={appointment.id}
                                                onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                                                className="p-3 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {formatTime(appointment.startDate)} - {formatTime(appointment.endDate)}
                                                        </div>
                                                        <div className="text-sm text-gray-900 mt-1">
                                                            {appointment.title}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            Cliente: {appointment.client?.firstName} {appointment.client?.lastName}
                                                        </div>
                                                        {appointment.technician && (
                                                            <div className="text-sm text-gray-600">
                                                                Técnico: {appointment.technician.firstName} {appointment.technician.lastName}
                                                            </div>
                                                        )}
                                                        {appointment.location && (
                                                            <div className="text-sm text-gray-600">
                                                                📍 {appointment.location}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                            <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                              {getStatusLabel(appointment.status)}
                            </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                                <Link
                                    href={`/dashboard/appointments/new?date=${selectedDate.toISOString()}`}
                                    className="w-full inline-flex justify-center px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none sm:w-auto sm:text-sm transition-colors"
                                >
                                    Nueva Cita
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(null)}
                                    className="mt-3 w-full inline-flex justify-center px-4 py-2 border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}