"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaSave,
  FaTimes,
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaBox,
  FaUndo
} from "react-icons/fa";

export default function EditDistributionPage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [distribution, setDistribution] = useState(null);
  const [distributionId, setDistributionId] = useState(null);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);

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
      fetchProducts();
      fetchEmployees();
    }
  }, [distributionId]);

  const fetchDistribution = async () => {
    try {
      const response = await fetch(`/api/distributions/${distributionId}`);
      if (response.ok) {
        const data = await response.json();
        setDistribution({
          employeeId: data.employeeId,
          date: new Date(data.date).toISOString().split("T")[0],
          status: data.status,
          notes: data.notes || "",
          returnDate: data.returnDate ? new Date(data.returnDate).toISOString().split("T")[0] : "",
          items: data.items.map(item => ({
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            productCode: item.product.code,
            productUnit: item.product.unit,
            productStock: item.product.stock,
            quantity: item.quantity,
            returned: item.returned || 0,
            notes: item.notes || "",
          })),
        });
      } else {
        console.error("Error al cargar distribución");
        router.push("/dashboard/distributions");
      }
    } catch (error) {
      console.error("Error:", error);
      router.push("/dashboard/distributions");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    }
  };

  const handleAddItem = () => {
    setDistribution({
      ...distribution,
      items: [
        ...distribution.items,
        {
          productId: "",
          productName: "",
          productCode: "",
          productUnit: "",
          productStock: 0,
          quantity: 1,
          returned: 0,
          notes: "",
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = distribution.items.filter((_, i) => i !== index);
    setDistribution({ ...distribution, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...distribution.items];

    if (field === "productId") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          productName: product.name,
          productCode: product.code || "",
          productUnit: product.unit || "pza",
          productStock: product.stock || 0,
        };
      }
    } else if (field === "quantity" || field === "returned") {
      newItems[index][field] = parseInt(value) || 0;
    } else {
      newItems[index][field] = value;
    }

    setDistribution({ ...distribution, items: newItems });
  };

  const validateForm = () => {
    // Validar que no haya equipos vacíos
    const invalidItems = distribution.items.filter(
      (item) => !item.productId || item.quantity <= 0
    );
    if (invalidItems.length > 0) {
      setError("Por favor complete todos los equipos correctamente");
      return false;
    }

    // Validar cantidades devueltas
    const invalidReturns = distribution.items.filter(
      (item) => item.returned > item.quantity
    );
    if (invalidReturns.length > 0) {
      setError("La cantidad devuelta no puede ser mayor a la cantidad distribuida");
      return false;
    }

    // Auto-detectar estado basado en devoluciones
    const totalQuantity = distribution.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReturned = distribution.items.reduce((sum, item) => sum + item.returned, 0);

    if (totalReturned === 0 && distribution.status === "RETURNED") {
      setError("No puede marcar como devuelto sin especificar cantidades devueltas");
      return false;
    }

    if (totalReturned > 0 && totalReturned < totalQuantity) {
      // Sugerir estado de devolución parcial
      if (distribution.status !== "PARTIAL_RETURN" && !confirm("Hay devoluciones parciales. ¿Desea marcar como Devolución Parcial?")) {
        return false;
      }
      setDistribution({ ...distribution, status: "PARTIAL_RETURN" });
    } else if (totalReturned === totalQuantity && totalReturned > 0) {
      // Sugerir estado de devuelto completo
      if (distribution.status !== "RETURNED" && !confirm("Todos los equipos fueron devueltos. ¿Desea marcar como Devuelto?")) {
        return false;
      }
      setDistribution({ ...distribution, status: "RETURNED" });
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/distributions/${distributionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: distribution.employeeId,
          date: distribution.date,
          status: distribution.status,
          notes: distribution.notes,
          returnDate: distribution.returnDate || null,
          items: distribution.items.map(item => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            returned: item.returned,
            notes: item.notes,
          })),
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/distributions/${distributionId}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la distribución");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al actualizar la distribución");
      setLoading(false);
    }
  };

  if (!distribution) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const totalQuantity = distribution.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReturned = distribution.items.reduce((sum, item) => sum + item.returned, 0);

  return (
    <div className="max-w-full mx-auto">
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <Link
            href={`/dashboard/distributions/${distributionId || ''}`}
            className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Distribución</h1>
            <p className="text-gray-600 mt-1">
              Actualice la información y los equipos de la distribución
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empleado *
              </label>
              <select
                value={distribution.employeeId}
                onChange={(e) => setDistribution({ ...distribution, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black bg-white"
                required
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - {employee.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={distribution.date}
                onChange={(e) => setDistribution({ ...distribution, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                value={distribution.status}
                onChange={(e) => setDistribution({ ...distribution, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black bg-white"
                required
              >
                <option value="PENDING">Pendiente</option>
                <option value="DELIVERED">Entregado</option>
                <option value="RETURNED">Devuelto</option>
                <option value="PARTIAL_RETURN">Devolución Parcial</option>
              </select>
            </div>

            {(distribution.status === "RETURNED" || distribution.status === "PARTIAL_RETURN") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Devolución
                </label>
                <input
                  type="date"
                  value={distribution.returnDate}
                  onChange={(e) => setDistribution({ ...distribution, returnDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={distribution.notes}
                onChange={(e) => setDistribution({ ...distribution, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black resize-none"
                placeholder="Notas adicionales sobre la distribución..."
              />
            </div>
          </div>
        </div>

        {/* Equipos Distribuidos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Equipos Distribuidos</h2>
              <p className="text-sm text-gray-500 mt-1">
                Total: {totalQuantity} unidades | Devueltas: {totalReturned} unidades
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Agregar Equipo
            </button>
          </div>

          {distribution.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No hay equipos en esta distribución</p>
              <p className="text-sm">Haga clic en "Agregar Equipo" para agregar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {distribution.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipo
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black bg-white"
                        required
                      >
                        <option value="">Seleccionar equipo</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - Stock: {product.stock} {product.unit}
                          </option>
                        ))}
                      </select>
                      {item.productId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Stock disponible: {item.productStock} {item.productUnit}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FaUndo className="inline h-3 w-3 mr-1" />
                        Devueltas
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.returned}
                        onChange={(e) => handleItemChange(index, "returned", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      />
                      {item.returned > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          {Math.round((item.returned / item.quantity) * 100)}% devuelto
                        </p>
                      )}
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="w-full px-4 py-2 text-red-600 bg-white border border-red-300 hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas del equipo
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      placeholder="Notas opcionales sobre este equipo..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/distributions/${distributionId}`)}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}