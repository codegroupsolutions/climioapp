"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FaUserPlus, FaEdit, FaTrash, FaPhone, FaEnvelope, FaUserTie, FaUserCog, FaUser, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter === "active") params.append("active", "true");
      if (statusFilter === "inactive") params.append("active", "false");

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) throw new Error("Error al cargar empleados");

      const data = await response.json();
      setEmployees(data.users || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (!confirm("¿Está seguro de desactivar este empleado?")) return;

    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al desactivar empleado");

      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Error al desactivar empleado");
    }
  };

  const handleToggleActive = async (employee) => {
    try {
      const response = await fetch(`/api/users/${employee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !employee.active,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar empleado");

      fetchEmployees();
    } catch (error) {
      console.error("Error toggling employee status:", error);
      alert("Error al actualizar estado del empleado");
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: "Administrador",
      TECHNICIAN: "Técnico",
      SALES: "Vendedor",
      ACCOUNTANT: "Contador",
    };
    return labels[role] || role;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN":
        return <FaUserCog className="text-purple-600" />;
      case "TECHNICIAN":
        return <FaUserTie className="text-blue-600" />;
      case "SALES":
        return <FaUser className="text-green-600" />;
      case "ACCOUNTANT":
        return <FaUser className="text-orange-600" />;
      default:
        return <FaUser className="text-gray-600" />;
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !roleFilter || employee.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Empleados</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona tu equipo de trabajo</p>
          </div>
          <Link
              href="/dashboard/employees/new"
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 rounded"
          >
            <FaUserPlus />
            Nuevo Empleado
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm sm:text-base"
              />
            </div>
            <div>
              <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm sm:text-base"
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="TECHNICIAN">Técnico</option>
                <option value="SALES">Vendedor</option>
                <option value="ACCOUNTANT">Contador</option>
              </select>
            </div>
            <div>
              <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    fetchEmployees();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm sm:text-base"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <div className="flex items-center">
              <span className="text-xs sm:text-sm text-gray-600">
                {filteredEmployees.length} empleados encontrados
              </span>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Contacto
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Rol
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Estado
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="inline-flex items-center">
                        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                        <span className="text-sm text-gray-600">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <FaUser className="mx-auto text-4xl text-gray-400 mb-4" />
                      <p className="text-sm">No se encontraron empleados</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        !employee.active ? 'opacity-75' : ''
                      }`}
                      onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {getRoleIcon(employee.role)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 md:hidden">
                              {getRoleLabel(employee.role)}
                            </div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">
                              {employee.email}
                            </div>
                            {employee.phone && (
                              <div className="text-xs text-gray-500 sm:hidden">
                                <FaPhone className="inline mr-1" />
                                {employee.phone}
                              </div>
                            )}
                            {!employee.active && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                                Inactivo
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <FaEnvelope className="text-gray-400 text-xs" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                          {employee.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaPhone className="text-gray-400 text-xs" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-900">
                          {getRoleLabel(employee.role)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center hidden lg:table-cell">
                        {employee.active ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(employee);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              employee.active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={employee.active ? 'Desactivar' : 'Activar'}
                          >
                            {employee.active ? (
                              <FaTimesCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/employees/${employee.id}`);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          {employee.active && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(employee.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Desactivar"
                            >
                              <FaTrash className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
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