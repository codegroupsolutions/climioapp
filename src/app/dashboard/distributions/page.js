"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaBox,
  FaUser,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaTimes
} from "react-icons/fa";

export default function DistributionsPage() {
  const router = useRouter();
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetchDistributions();
  }, [searchTerm, filterStatus, startDate, endDate]);

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (searchTerm) params.append("search", searchTerm);
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/distributions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDistributions(data);
      } else {
        console.error("Error al cargar distribuciones");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Está seguro de eliminar esta distribución?")) {
      try {
        const response = await fetch(`/api/distributions/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          fetchDistributions();
        } else {
          alert("Error al eliminar distribución");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al eliminar distribución");
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: "bg-yellow-50 text-yellow-800 border border-yellow-200",
      DELIVERED: "bg-green-50 text-green-800 border border-green-200",
      RETURNED: "bg-blue-50 text-blue-800 border border-blue-200",
      PARTIAL_RETURN: "bg-gray-50 text-gray-800 border border-gray-300",
    };

    const labels = {
      PENDING: "Pendiente",
      DELIVERED: "Entregado",
      RETURNED: "Devuelto",
      PARTIAL_RETURN: "Devolución Parcial",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = searchTerm || filterStatus !== "all" || startDate || endDate;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Distribuciones</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestione la distribución de equipos a empleados</p>
        </div>
        <Link
          href="/dashboard/distributions/new"
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors text-center sm:text-left rounded"
        >
          Nueva Distribución
        </Link>
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
                  placeholder="Buscar por empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 focus:outline-none focus:border-black appearance-none bg-white"
                >
                  <option value="all">Todos los estados</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="RETURNED">Devuelto</option>
                  <option value="PARTIAL_RETURN">Devolución Parcial</option>
                </select>
              </div>
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
                    Fecha desde
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
                    Fecha hasta
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
                {filterStatus !== "all" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Estado: {filterStatus === "PENDING" ? "Pendiente" :
                             filterStatus === "DELIVERED" ? "Entregado" :
                             filterStatus === "RETURNED" ? "Devuelto" : "Devolución Parcial"}
                    <button
                      onClick={() => setFilterStatus("all")}
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
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {distributions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron distribuciones
                  </td>
                </tr>
              ) : (
                distributions.map((distribution) => (
                  <tr key={distribution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(distribution.date).toLocaleDateString("es-PR")}
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
                            {distribution.employee.firstName} {distribution.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {distribution.employee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {distribution.items.length} equipo{distribution.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {distribution.items.reduce((sum, item) => sum + item.quantity, 0)} unidades totales
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(distribution.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/distributions/${distribution.id}`}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Ver detalles"
                        >
                          <FaEye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/distributions/${distribution.id}/edit`}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Editar"
                        >
                          <FaEdit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(distribution.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}