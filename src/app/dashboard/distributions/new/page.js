"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";

export default function NewDistributionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [],
  });

  useEffect(() => {
    fetchEmployees();
    fetchProducts();
  }, []);

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

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: "",
          quantity: 1,
          notes: "",
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === "quantity" ? parseInt(value) || 0 : value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.employeeId) {
      setError("Por favor seleccione un empleado");
      return;
    }

    if (formData.items.length === 0) {
      setError("Por favor agregue al menos un equipo");
      return;
    }

    const invalidItems = formData.items.filter(
      (item) => !item.productId || item.quantity <= 0
    );
    if (invalidItems.length > 0) {
      setError("Por favor complete todos los equipos correctamente");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/distributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const distribution = await response.json();
        router.push(`/dashboard/distributions/${distribution.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la distribución");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al crear la distribución");
      setLoading(false);
    }
  };

  const getProductStock = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.stock : 0;
  };

  return (
    <div className="max-w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Distribución</h1>
        <p className="text-gray-600 mt-1">
          Asigne equipos del inventario a un empleado
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empleado *
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData({ ...formData, employeeId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black bg-white"
                required
              >
                <option value="">Seleccionar empleado</option>
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
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                placeholder="Notas adicionales sobre la distribución..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Equipos a Distribuir</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Agregar Equipo
            </button>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No hay equipos agregados</p>
              <p className="text-sm">Haga clic en "Agregar Equipo" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipo
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          handleItemChange(index, "productId", e.target.value)
                        }
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
                          Stock disponible: {getProductStock(item.productId)} unidades
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
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        required
                      />
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
                      onChange={(e) =>
                        handleItemChange(index, "notes", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notas opcionales..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/distributions")}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Guardando..." : "Guardar Distribución"}
          </button>
        </div>
      </form>
    </div>
  );
}