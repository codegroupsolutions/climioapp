"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FaSave, FaTimes } from "react-icons/fa";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

  const [employee, setEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "TECHNICIAN",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (employee.password !== employee.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validate password complexity
    if (employee.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!passwordRegex.test(employee.password)) {
      setError(
        "La contraseña debe incluir mayúscula, minúscula, número y símbolo"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          password: employee.password,
          phone: employee.phone,
          role: employee.role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear empleado");
      }

      const newEmployee = await response.json();
      router.push(`/dashboard/employees/${newEmployee.id}`);
    } catch (error) {
      console.error("Error creating employee:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Empleado</h1>
          <p className="text-gray-600 mt-1">
            Agregue un nuevo empleado a su empresa
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={employee.firstName}
                onChange={(e) =>
                  setEmployee({ ...employee, firstName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                value={employee.lastName}
                onChange={(e) =>
                  setEmployee({ ...employee, lastName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={employee.email}
                onChange={(e) =>
                  setEmployee({ ...employee, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Se usará para iniciar sesión
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={employee.phone}
                onChange={(e) =>
                  setEmployee({ ...employee, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                value={employee.password}
                onChange={(e) =>
                  setEmployee({ ...employee, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                value={employee.confirmPassword}
                onChange={(e) =>
                  setEmployee({ ...employee, confirmPassword: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                value={employee.role}
                onChange={(e) =>
                  setEmployee({ ...employee, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="TECHNICIAN">Técnico</option>
                <option value="ADMIN">Administrador</option>
                <option value="SALES">Vendedor</option>
                <option value="ACCOUNTANT">Contador</option>
              </select>
              <div className="mt-2 text-sm text-gray-500">
                <p className="font-medium mb-1">Permisos por rol:</p>
                <ul className="space-y-1">
                  <li>
                    <strong>Técnico:</strong> Gestión de citas y servicios
                  </li>
                  <li>
                    <strong>Administrador:</strong> Acceso completo al sistema
                  </li>
                  <li>
                    <strong>Vendedor:</strong> Clientes, cotizaciones y ventas
                  </li>
                  <li>
                    <strong>Contador:</strong> Facturas, pagos y reportes financieros
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/employees")}
              className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FaTimes />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave />
              {loading ? "Creando..." : "Crear Empleado"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
