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
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <Link
              href="/dashboard/employees/new"
              className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <FaUserPlus />
            Nuevo Empleado
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                {filteredEmployees.length} empleados encontrados
              </span>
            </div>
          </div>
        </div>

        {/* Employees Grid */}
        {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <FaUser className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">No se encontraron empleados</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => (
                  <div
                      key={employee.id}
                      className={`bg-white rounded-lg border ${
                          employee.active ? "border-gray-200" : "border-red-200 opacity-75"
                      } p-6 hover:shadow-lg transition-shadow cursor-pointer relative`}
                      onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                  >
                    {!employee.active && (
                        <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                      Inactivo
                    </span>
                        </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {getRoleIcon(employee.role)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {getRoleLabel(employee.role)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaEnvelope className="text-gray-400" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      {employee.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaPhone className="text-gray-400" />
                            <span>{employee.phone}</span>
                          </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                      <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(employee);
                          }}
                          className={`text-sm font-medium ${
                              employee.active
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-green-600 hover:text-green-700"
                          }`}
                      >
                        {employee.active ? (
                            <>
                              <FaTimesCircle className="inline mr-1" />
                              Desactivar
                            </>
                        ) : (
                            <>
                              <FaCheckCircle className="inline mr-1" />
                              Activar
                            </>
                        )}
                      </button>
                      <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/employees/${employee.id}`);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FaEdit />
                        </button>
                        {employee.active && (
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(employee.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FaTrash />
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}