"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FaEdit, FaSave, FaTimes, FaUser, FaEnvelope, FaPhone, FaIdCard, FaLock, FaCheckCircle, FaTimesCircle, FaTrash } from "react-icons/fa";

export default function EmployeeDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

  const [editedEmployee, setEditedEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    active: true,
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchEmployee();
  }, [resolvedParams.id]);

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`);
      if (!response.ok) throw new Error("Error al cargar empleado");

      const data = await response.json();
      setEmployee(data);
      setEditedEmployee({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
        role: data.role,
        active: data.active,
      });
    } catch (error) {
      console.error("Error fetching employee:", error);
      setError("Error al cargar información del empleado");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedEmployee),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar empleado");
      }

      const updatedEmployee = await response.json();
      setEmployee({ ...employee, ...updatedEmployee });
      setEditing(false);
    } catch (error) {
      console.error("Error updating employee:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!passwordRegex.test(passwordData.newPassword)) {
      setError(
        "La contraseña debe incluir mayúscula, minúscula, número y símbolo"
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al cambiar contraseña");
      }

      setShowPasswordChange(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
      alert("Contraseña actualizada correctamente");
    } catch (error) {
      console.error("Error changing password:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !employee.active,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar estado");
      }

      const updatedEmployee = await response.json();
      setEmployee({ ...employee, ...updatedEmployee });
      setEditedEmployee({ ...editedEmployee, active: updatedEmployee.active });
    } catch (error) {
      console.error("Error toggling active status:", error);
      setError(error.message);
    } finally {
      setSaving(false);
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

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-PR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </>
    );
  }

  if (!employee) {
    return (
      <>
        <div className="text-center text-red-600">Empleado no encontrado</div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {editing ? "Editar Empleado" : "Detalle del Empleado"}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  employee.active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {employee.active ? (
                  <>
                    <FaCheckCircle className="mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="mr-1" />
                    Inactivo
                  </>
                )}
              </span>
              <span className="text-sm text-gray-500">
                Creado {formatDate(employee.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaEdit />
                  Editar
                </button>
                <button
                  onClick={handleToggleActive}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    employee.active
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {employee.active ? (
                    <>
                      <FaTimesCircle />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Activar
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {editing ? (
                <form onSubmit={handleUpdate}>
                  <h2 className="text-lg font-semibold mb-4">
                    Información Personal
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={editedEmployee.firstName}
                        onChange={(e) =>
                          setEditedEmployee({
                            ...editedEmployee,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={editedEmployee.lastName}
                        onChange={(e) =>
                          setEditedEmployee({
                            ...editedEmployee,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editedEmployee.email}
                        onChange={(e) =>
                          setEditedEmployee({
                            ...editedEmployee,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={editedEmployee.phone}
                        onChange={(e) =>
                          setEditedEmployee({
                            ...editedEmployee,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol
                      </label>
                      <select
                        value={editedEmployee.role}
                        onChange={(e) =>
                          setEditedEmployee({
                            ...editedEmployee,
                            role: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="TECHNICIAN">Técnico</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="SALES">Vendedor</option>
                        <option value="ACCOUNTANT">Contador</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setEditedEmployee({
                          firstName: employee.firstName,
                          lastName: employee.lastName,
                          email: employee.email,
                          phone: employee.phone || "",
                          role: employee.role,
                          active: employee.active,
                        });
                      }}
                      className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <FaSave />
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaUser />
                    Información Personal
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nombre Completo</p>
                      <p className="font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rol</p>
                      <p className="font-medium text-gray-900">
                        {getRoleLabel(employee.role)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                        <FaEnvelope className="text-gray-400" />
                        Email
                      </p>
                      <p className="font-medium text-gray-900">{employee.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                        <FaPhone className="text-gray-400" />
                        Teléfono
                      </p>
                      <p className="font-medium text-gray-900">
                        {employee.phone || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaLock />
                Seguridad
              </h2>
              {showPasswordChange ? (
                <form onSubmit={handlePasswordChange}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({ newPassword: "", confirmPassword: "" });
                      }}
                      className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Actualizando..." : "Actualizar Contraseña"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cambiar Contraseña
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">ID de Usuario</p>
                  <p className="font-mono text-xs text-gray-600">
                    {employee.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Última Actualización</p>
                  <p className="text-sm font-medium">
                    {formatDate(employee.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/dashboard/appointments/new")}
                  className="w-full px-4 py-2 text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  Asignar Nueva Cita
                </button>
                <button
                  onClick={() => router.push("/dashboard/employees")}
                  className="w-full px-4 py-2 text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  Ver Todos los Empleados
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
