"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaEdit,
  FaTrash,
  FaUser,
  FaBox,
  FaCalendar,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowLeft
} from "react-icons/fa";

export default function DistributionDetailPage({ params }) {
  const router = useRouter();
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distributionId, setDistributionId] = useState(null);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setDistributionId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (distributionId) {
      fetchDistribution();
    }
  }, [distributionId]);

  const fetchDistribution = async () => {
    try {
      const response = await fetch(`/api/distributions/${distributionId}`);
      if (response.ok) {
        const data = await response.json();
        setDistribution(data);
      } else {
        console.error("Error al cargar distribución");
        router.push("/dashboard/distributions");
      }
    } catch (error) {
      console.error("Error:", error);
      router.push("/dashboard/distributions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("¿Está seguro de eliminar esta distribución?")) {
      try {
        const response = await fetch(`/api/distributions/${distributionId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          router.push("/dashboard/distributions");
        } else {
          alert("Error al eliminar distribución");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al eliminar distribución");
      }
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await fetch(`/api/distributions/${distributionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          returnDate: newStatus === "RETURNED" ? new Date().toISOString() : null
        }),
      });

      if (response.ok) {
        fetchDistribution();
      } else {
        alert("Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el estado");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: "bg-yellow-50 border border-yellow-200", text: "text-yellow-800", icon: FaExclamationCircle },
      DELIVERED: { bg: "bg-green-50 border border-green-200", text: "text-green-800", icon: FaCheckCircle },
      RETURNED: { bg: "bg-blue-50 border border-blue-200", text: "text-blue-800", icon: FaCheckCircle },
      PARTIAL_RETURN: { bg: "bg-gray-50 border border-gray-300", text: "text-gray-800", icon: FaExclamationCircle },
    };

    const labels = {
      PENDING: "Pendiente",
      DELIVERED: "Entregado",
      RETURNED: "Devuelto",
      PARTIAL_RETURN: "Devolución Parcial",
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text} inline-flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!distribution) {
    return null;
  }

  const totalQuantity = distribution.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReturned = distribution.items.reduce((sum, item) => sum + item.returned, 0);

  return (
    <div className="max-w-full mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/distributions"
            className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalle de Distribución
            </h1>
            <p className="text-gray-600 mt-1">
              Información completa de la distribución
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/dashboard/distributions/${distributionId}/edit`}
            className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 bg-white border border-red-300 hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Información General</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <FaCalendar className="inline mr-2 text-gray-400" />
                Fecha: {new Date(distribution.date).toLocaleDateString("es-PR")}
              </p>
              {distribution.returnDate && (
                <p className="text-gray-600">
                  <FaCalendar className="inline mr-2 text-gray-400" />
                  Fecha de devolución: {new Date(distribution.returnDate).toLocaleDateString("es-PR")}
                </p>
              )}
              <p className="text-gray-600">
                Estado: {getStatusBadge(distribution.status)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Acciones rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {distribution.status === "PENDING" && (
                <button
                  onClick={() => handleStatusUpdate("DELIVERED")}
                  className="px-3 py-1.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
                >
                  Marcar como Entregado
                </button>
              )}
              {distribution.status === "DELIVERED" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate("RETURNED")}
                    className="px-3 py-1.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
                  >
                    Marcar como Devuelto
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("PARTIAL_RETURN")}
                    className="px-3 py-1.5 text-gray-600 bg-white border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Devolución Parcial
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Empleado Asignado</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaUser className="text-gray-500 text-sm" />
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {distribution.employee.firstName} {distribution.employee.lastName}
                </p>
                <p className="text-sm text-gray-600">{distribution.employee.email}</p>
                {distribution.employee.phone && (
                  <p className="text-sm text-gray-600">Tel: {distribution.employee.phone}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Rol: {distribution.employee.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {distribution.notes && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Notas</h3>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
              {distribution.notes}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Equipos Distribuidos</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">
              Total: <span className="font-medium text-gray-900">{totalQuantity}</span> unidades
            </span>
            {totalReturned > 0 && (
              <span className="text-gray-500">
                Devueltas: <span className="font-medium text-green-600">{totalReturned}</span>
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Equipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Devueltas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {distribution.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.product.code || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </p>
                      {item.product.description && (
                        <p className="text-xs text-gray-500">
                          {item.product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.product.category.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className="font-medium">{item.quantity}</span>
                    <span className="text-gray-500 ml-1">{item.product.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {item.returned > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                        {item.returned}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-900">
                  Total
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-center text-gray-900">
                  {totalQuantity}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-center">
                  {totalReturned > 0 ? (
                    <span className="text-green-600">{totalReturned}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}