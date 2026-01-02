"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { prepareDateForInput, fromDatetimeLocalString } from "@/utils/dateUtils";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const dateParam = searchParams.get("date");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [appointment, setAppointment] = useState({
    clientId: clientId || "",
    title: "",
    description: "",
    startDate: dateParam ? prepareDateForInput(dateParam) : "",
    endDate: "",
    type: "SERVICE",
    status: "SCHEDULED",
    technicianId: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    fetchClients();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setAppointment(prev => ({
          ...prev,
          location: (client.address + ' ' + client.city + ' ' + client.state + ' ' + client.zipCode) || "",
        }));
      }
    }
  }, [clientId, clients]);

  const fetchClients = async () => {
    try {
      let allClients = [];
      let page = 1;
      let hasMore = true;
      const limit = 100; // Tamaño de página para las peticiones

      while (hasMore) {
        const response = await fetch(`/api/clients?page=${page}&limit=${limit}`);
        if (!response.ok) throw new Error("Error al cargar clientes");
        const data = await response.json();
        
        allClients = [...allClients, ...(data.clients || [])];
        
        // Verificar si hay más páginas
        hasMore = page < data.pagination.totalPages;
        page++;
      }

      // Ordenar clientes alfabéticamente por nombre mostrado
      allClients.sort((a, b) => {
        const nameA = (a.companyName || `${a.firstName} ${a.lastName}`).toLowerCase();
        const nameB = (b.companyName || `${b.firstName} ${b.lastName}`).toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setClients(allClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch("/api/users?active=true");
      if (!response.ok) throw new Error("Error al cargar empleados");
      const data = await response.json();
      setTechnicians(data.users || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!appointment.clientId || !appointment.title || !appointment.startDate) {
      setError("Por favor complete todos los campos requeridos");
      setSaving(false);
      return;
    }

    try {
      // Convertir fechas de timezone PR a UTC para enviar al servidor
      const appointmentData = {
        ...appointment,
        startDate: fromDatetimeLocalString(appointment.startDate)?.toISOString() || appointment.startDate,
        endDate: appointment.endDate ? fromDatetimeLocalString(appointment.endDate)?.toISOString() : null,
      };

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear cita");
      }

      const data = await response.json();
      router.push(`/dashboard/appointments/${data.id}`);
    } catch (error) {
      console.error("Error creating appointment:", error);
      setError(error.message);
      setSaving(false);
    }
  };

  const handleDateChange = (field, value) => {
    setAppointment(prev => {
      const updated = { ...prev, [field]: value };

      if (field === "startDate" && !prev.endDate && value) {
        // Parsear la fecha del input (que está en formato datetime-local)
        const [datePart, timePart] = value.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);

        // Crear fecha en timezone local y agregar 1 hora
        const startDate = new Date(year, month - 1, day, hour + 1, minute, 0);

        // Formatear de vuelta a datetime-local
        const endYear = startDate.getFullYear();
        const endMonth = String(startDate.getMonth() + 1).padStart(2, '0');
        const endDay = String(startDate.getDate()).padStart(2, '0');
        const endHour = String(startDate.getHours()).padStart(2, '0');
        const endMinute = String(startDate.getMinutes()).padStart(2, '0');

        updated.endDate = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}`;
      }

      return updated;
    });
  };

  return (
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Nueva Cita
          </h1>
          <button
              onClick={() => router.push("/dashboard/appointments")}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>

        {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                  value={appointment.clientId}
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    setAppointment(prev => ({
                      ...prev,
                      clientId: e.target.value,
                      location: client ? (client?.address + ' ' + client?.city + ' ' + client?.state + ' ' + client?.zipCode) || "" : "",
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              >
                <option value="">Seleccionar cliente</option>
                {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName || `${client.firstName} ${client.lastName}`}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignar a
              </label>
              <select
                  value={appointment.technicianId}
                  onChange={(e) => setAppointment(prev => ({ ...prev, technicianId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName} ({tech.role === 'ADMIN' ? 'Admin' : tech.role === 'TECHNICIAN' ? 'Técnico' : tech.role === 'SALES' ? 'Vendedor' : 'Contador'})
                    </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                  type="text"
                  value={appointment.title}
                  onChange={(e) => setAppointment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                  value={appointment.type}
                  onChange={(e) => setAppointment(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              >
                <option value="SERVICE">Servicio</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="INSTALLATION">Instalación</option>
                <option value="REPAIR">Reparación</option>
                <option value="INSPECTION">Inspección</option>
                <option value="CONSULTATION">Consulta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                  value={appointment.status}
                  onChange={(e) => setAppointment(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SCHEDULED">Programado</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha/Hora Inicio *
              </label>
              <input
                  type="datetime-local"
                  value={appointment.startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha/Hora Fin
              </label>
              <input
                  type="datetime-local"
                  value={appointment.endDate}
                  onChange={(e) => setAppointment(prev => ({ ...prev, endDate: e.target.value }))}
                  min={appointment.startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <input
                  type="text"
                  value={appointment.location}
                  onChange={(e) => setAppointment(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dirección del servicio"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                  value={appointment.description}
                  onChange={(e) => setAppointment(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del servicio a realizar"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Internas
              </label>
              <textarea
                  value={appointment.notes}
                  onChange={(e) => setAppointment(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas adicionales (no visibles para el cliente)"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
                type="button"
                onClick={() => router.push("/dashboard/appointments")}
                className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Crear Cita"}
            </button>
          </div>
        </form>
      </div>
  );
}