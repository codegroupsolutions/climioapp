"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaCheckCircle,
  FaClock,
  FaUser,
  FaCalendarAlt,
  FaClipboardList,
  FaSearch,
  FaFilter,
  FaTimes
} from "react-icons/fa";

export default function PendingTasksPage() {
  const router = useRouter();
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTechnician, setFilterTechnician] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetchPendingTasks();
    fetchTechnicians();
  }, [searchTerm, filterTechnician, startDate, endDate]);

  const fetchPendingTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterTechnician) params.append("technicianId", filterTechnician);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/pending-tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPendingTasks(data);
      } else {
        console.error("Error al cargar tareas pendientes");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch("/api/users?active=true");
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  const markTaskAsCompleted = async (appointmentId, taskId) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/complete-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId }),
      });

      if (response.ok) {
        fetchPendingTasks(); // Refresh the list
      } else {
        console.error("Error al completar tarea");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterTechnician("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = searchTerm || filterTechnician || startDate || endDate;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("es-PR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("es-PR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tareas Pendientes</h1>
        <p className="text-gray-600 mt-1">
          Gestione todas las tareas pendientes de las citas
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-4">
            {/* Filtros principales */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por cliente, cita o tarea..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
              {technicians.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaFilter className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={filterTechnician}
                    onChange={(e) => setFilterTechnician(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 focus:outline-none focus:border-black appearance-none bg-white"
                  >
                    <option value="">Todos los técnicos</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.firstName} {tech.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FaCalendarAlt className="h-4 w-4" />
                {showAdvancedFilters ? "Ocultar" : "Filtros"} de Fecha
              </button>
            </div>

            {/* Filtros avanzados (fechas) */}
            {showAdvancedFilters && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de cita desde
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de cita hasta
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <FaTimes className="h-4 w-4" />
                      Limpiar Filtros
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Resumen de filtros activos */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Filtros activos:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Búsqueda: {searchTerm}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filterTechnician && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Técnico: {technicians.find(t => t.id === filterTechnician)?.firstName} {technicians.find(t => t.id === filterTechnician)?.lastName}
                    <button
                      onClick={() => setFilterTechnician("")}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {startDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Desde: {new Date(startDate).toLocaleDateString("es-PR")}
                    <button
                      onClick={() => setStartDate("")}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Hasta: {new Date(endDate).toLocaleDateString("es-PR")}
                    <button
                      onClick={() => setEndDate("")}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarea
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Cita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Técnico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No hay tareas pendientes
                  </td>
                </tr>
              ) : (
                pendingTasks.map((item) => (
                  <tr key={`${item.appointmentId}-${item.task.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-4 w-4 rounded border-2 border-yellow-400 bg-white"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.task.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Creada: {formatDate(item.task.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUser className="text-gray-500 text-xs" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.client.firstName} {item.client.lastName}
                          </div>
                          {item.client.companyName && (
                            <div className="text-xs text-gray-500">
                              {item.client.companyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/appointments/${item.appointmentId}`}
                        className="text-sm text-black hover:underline font-medium"
                      >
                        {item.appointment.title}
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.appointment.type === "SERVICE" && "Servicio"}
                        {item.appointment.type === "INSTALLATION" && "Instalación"}
                        {item.appointment.type === "MAINTENANCE" && "Mantenimiento"}
                        {item.appointment.type === "REPAIR" && "Reparación"}
                        {item.appointment.type === "INSPECTION" && "Inspección"}
                        {item.appointment.type === "CONSULTATION" && "Consulta"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <FaCalendarAlt className="inline mr-2 text-gray-400" />
                        {formatDate(item.appointment.startDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        <FaClock className="inline mr-2 text-gray-400" />
                        {formatTime(item.appointment.startDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.technician ? (
                        <div className="text-sm text-gray-900">
                          {item.technician.firstName} {item.technician.lastName}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => markTaskAsCompleted(item.appointmentId, item.task.id)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Marcar como completada"
                        >
                          <FaCheckCircle className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/dashboard/appointments/${item.appointmentId}`}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="Ver cita"
                        >
                          <FaClipboardList className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {pendingTasks.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium text-gray-900">{pendingTasks.length}</span> tarea{pendingTasks.length !== 1 ? "s" : ""} pendiente{pendingTasks.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}