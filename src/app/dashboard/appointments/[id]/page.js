"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FaEdit, FaTrash, FaCalendarAlt, FaClock, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { toDatetimeLocalString, fromDatetimeLocalString, formatDisplayDate } from "@/utils/dateUtils";

export default function AppointmentDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [editedAppointment, setEditedAppointment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [pendingTasks, setPendingTasks] = useState([]);
  const [newPendingTask, setNewPendingTask] = useState("");

  useEffect(() => {
    fetchAppointment();
    fetchTechnicians();
  }, [resolvedParams.id]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${resolvedParams.id}`);
      if (!response.ok) throw new Error("Error al cargar cita");
      const data = await response.json();
      setAppointment(data);
      setEditedAppointment({
        ...data,
        startDate: data.startDate ? toDatetimeLocalString(data.startDate) : "",
        endDate: data.endDate ? toDatetimeLocalString(data.endDate) : "",
      });
      // Load tasks if they exist
      if (data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      } else {
        setTasks([]);
      }
      // Load pending tasks if they exist
      if (data.pendingTasks && Array.isArray(data.pendingTasks)) {
        setPendingTasks(data.pendingTasks);
      } else {
        setPendingTasks([]);
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      setError("Error al cargar la cita");
    } finally {
      setLoading(false);
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Convertir fechas de timezone PR a UTC para enviar al servidor
      const appointmentData = {
        ...editedAppointment,
        startDate: fromDatetimeLocalString(editedAppointment.startDate)?.toISOString() || editedAppointment.startDate,
        endDate: editedAppointment.endDate ? fromDatetimeLocalString(editedAppointment.endDate)?.toISOString() : null,
      };

      const response = await fetch(`/api/appointments/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar cita");
      }

      const data = await response.json();
      setAppointment(data);
      setEditing(false);
      setEditedAppointment({
        ...data,
        startDate: data.startDate ? toDatetimeLocalString(data.startDate) : "",
        endDate: data.endDate ? toDatetimeLocalString(data.endDate) : "",
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Está seguro de eliminar esta cita?")) return;

    try {
      const response = await fetch(`/api/appointments/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar cita");
      }

      router.push("/dashboard/appointments");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setError(error.message);
    }
  };

  const addTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now().toString(),
      description: newTask,
      completed: true, // Automatically mark as completed
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString() // Set completion time
    };

    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    setNewTask("");
    updateTasksInDB(updatedTasks);
  };

  const addPendingTask = () => {
    if (!newPendingTask.trim()) return;

    const task = {
      id: Date.now().toString(),
      description: newPendingTask,
      createdAt: new Date().toISOString()
    };

    const updatedPendingTasks = [...pendingTasks, task];
    setPendingTasks(updatedPendingTasks);
    setNewPendingTask("");
    updatePendingTasksInDB(updatedPendingTasks);
  };

  const toggleTaskComplete = (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null }
        : task
    );
    setTasks(updatedTasks);
    updateTasksInDB(updatedTasks);
  };

  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    updateTasksInDB(updatedTasks);
  };

  const deletePendingTask = (taskId) => {
    const updatedPendingTasks = pendingTasks.filter(task => task.id !== taskId);
    setPendingTasks(updatedPendingTasks);
    updatePendingTasksInDB(updatedPendingTasks);
  };

  const movePendingTaskToCompleted = (taskId) => {
    const taskToMove = pendingTasks.find(task => task.id === taskId);
    if (taskToMove) {
      // Remove from pending
      const updatedPendingTasks = pendingTasks.filter(task => task.id !== taskId);
      setPendingTasks(updatedPendingTasks);

      // Add to completed with current timestamp
      const completedTask = {
        ...taskToMove,
        completed: true,
        completedAt: new Date().toISOString()
      };
      const updatedTasks = [...tasks, completedTask];
      setTasks(updatedTasks);

      // Update both lists in database
      updateBothTaskLists(updatedTasks, updatedPendingTasks);
    }
  };

  const updateTasksInDB = async (updatedTasks) => {
    try {
      const response = await fetch(`/api/appointments/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar tareas");
      }
    } catch (error) {
      console.error("Error updating tasks:", error);
      setError("Error al actualizar las tareas");
    }
  };

  const updatePendingTasksInDB = async (updatedPendingTasks) => {
    try {
      const response = await fetch(`/api/appointments/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pendingTasks: updatedPendingTasks }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar tareas pendientes");
      }
    } catch (error) {
      console.error("Error updating pending tasks:", error);
      setError("Error al actualizar las tareas pendientes");
    }
  };

  const updateBothTaskLists = async (updatedTasks, updatedPendingTasks) => {
    try {
      const response = await fetch(`/api/appointments/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: updatedTasks,
          pendingTasks: updatedPendingTasks
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar tareas");
      }
    } catch (error) {
      console.error("Error updating task lists:", error);
      setError("Error al actualizar las listas de tareas");
    }
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/appointments/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar estado");
      }

      const data = await response.json();
      setAppointment(data);
      setEditedAppointment({
        ...data,
        startDate: data.startDate ? toDatetimeLocalString(data.startDate) : "",
        endDate: data.endDate ? toDatetimeLocalString(data.endDate) : "",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      SCHEDULED: "Programado",
      IN_PROGRESS: "En Progreso",
      COMPLETED: "Completado",
      CANCELLED: "Cancelado",
    };
    return texts[status] || status;
  };

  const getTypeText = (type) => {
    const texts = {
      SERVICE: "Servicio",
      MAINTENANCE: "Mantenimiento",
      INSTALLATION: "Instalación",
      REPAIR: "Reparación",
      INSPECTION: "Inspección",
      CONSULTATION: "Consulta",
    };
    return texts[type] || type;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return formatDisplayDate(date, true);
  };

  if (loading) {
    return (
      <>
        <div className="text-center">Cargando...</div>
      </>
    );
  }

  if (!appointment) {
    return (
      <>
        <div className="text-center text-red-600">Cita no encontrada</div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-full mx-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {editing ? "Editar Cita" : "Detalle de Cita"}
                </h1>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                  {getStatusText(appointment.status)}
                </span>
              </div>
              <div className="flex gap-2">
                {!editing && appointment.status === "SCHEDULED" && (
                  <>
                    <button
                      onClick={() => handleStatusChange("IN_PROGRESS")}
                      disabled={saving}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                      <FaClock className="inline mr-2" />
                      Iniciar
                    </button>
                    <button
                      onClick={() => handleStatusChange("CANCELLED")}
                      disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <FaTimesCircle className="inline mr-2" />
                      Cancelar
                    </button>
                  </>
                )}
                {!editing && appointment.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => handleStatusChange("COMPLETED")}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <FaCheckCircle className="inline mr-2" />
                    Completar
                  </button>
                )}
                {!editing && appointment.status === "COMPLETED" && (
                  <button
                    onClick={() => handleStatusChange("IN_PROGRESS")}
                    disabled={saving}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    <FaClock className="inline mr-2" />
                    Reabrir
                  </button>
                )}
                {!editing && appointment.status !== "CANCELLED" && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    <FaEdit className="inline mr-2" />
                    Editar
                  </button>
                )}
                {!editing && appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED" && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <FaTrash className="inline mr-2" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                  {editing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título
                        </label>
                        <input
                          type="text"
                          value={editedAppointment.title}
                          onChange={(e) => setEditedAppointment(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo
                          </label>
                          <select
                            value={editedAppointment.type}
                            onChange={(e) => setEditedAppointment(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
                            Asignar a
                          </label>
                          <select
                            value={editedAppointment.technicianId || ""}
                            onChange={(e) => setEditedAppointment(prev => ({ ...prev, technicianId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          >
                            <option value="">Sin asignar</option>
                            {technicians.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.firstName} {tech.lastName} ({tech.role === 'ADMIN' ? 'Admin' : tech.role === 'TECHNICIAN' ? 'Técnico' : tech.role === 'SALES' ? 'Vendedor' : 'Contador'})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha/Hora Inicio
                          </label>
                          <input
                            type="datetime-local"
                            value={editedAppointment.startDate}
                            onChange={(e) => setEditedAppointment(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha/Hora Fin
                          </label>
                          <input
                            type="datetime-local"
                            value={editedAppointment.endDate}
                            onChange={(e) => setEditedAppointment(prev => ({ ...prev, endDate: e.target.value }))}
                            min={editedAppointment.startDate}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={editedAppointment.location || ""}
                          onChange={(e) => setEditedAppointment(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción
                        </label>
                        <textarea
                          value={editedAppointment.description || ""}
                          onChange={(e) => setEditedAppointment(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notas Internas
                        </label>
                        <textarea
                          value={editedAppointment.notes || ""}
                          onChange={(e) => setEditedAppointment(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>

                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            setEditedAppointment({
                              ...appointment,
                              startDate: appointment.startDate ? toDatetimeLocalString(appointment.startDate) : "",
                              endDate: appointment.endDate ? toDatetimeLocalString(appointment.endDate) : "",
                            });
                          }}
                          className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                          {saving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-4">{appointment.title}</h2>
                        <p className="text-gray-600 mb-4">{appointment.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Tipo de Servicio</p>
                          <p className="font-medium">{getTypeText(appointment.type)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Asignado a</p>
                          <p className="font-medium">
                            {appointment.technician
                              ? `${appointment.technician.firstName} ${appointment.technician.lastName}`
                              : "Sin asignar"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Fecha/Hora Inicio</p>
                          <p className="font-medium flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-400" />
                            {formatDate(appointment.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Fecha/Hora Fin</p>
                          <p className="font-medium flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-400" />
                            {appointment.endDate ? formatDate(appointment.endDate) : "No especificada"}
                          </p>
                        </div>
                      </div>

                      {appointment.location && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Ubicación</p>
                          <p className="font-medium flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-gray-400" />
                            {appointment.location}
                          </p>
                        </div>
                      )}

                      {appointment.notes && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Notas Internas</p>
                          <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{appointment.notes}</p>
                        </div>
                      )}

                      {appointment.serviceContract && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Contrato de Servicio Asociado</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-blue-900">
                                {appointment.serviceContract.contractNumber}
                              </p>
                              <p className="text-sm text-blue-700">
                                {appointment.serviceContract.serviceType === 'MAINTENANCE' ? 'Mantenimiento' :
                                 appointment.serviceContract.serviceType === 'SUPPORT' ? 'Soporte' :
                                 appointment.serviceContract.serviceType === 'FULL_SERVICE' ? 'Servicio Completo' :
                                 appointment.serviceContract.serviceType === 'INSPECTION' ? 'Inspección' :
                                 appointment.serviceContract.serviceType === 'CONSULTATION' ? 'Consultoría' : 'Servicio'}
                                {' - '}
                                {appointment.serviceContract.serviceFrequency === 'MONTHLY' ? 'Mensual' :
                                 appointment.serviceContract.serviceFrequency === 'QUARTERLY' ? 'Trimestral' :
                                 appointment.serviceContract.serviceFrequency === 'SEMIANNUAL' ? 'Semestral' :
                                 appointment.serviceContract.serviceFrequency === 'ANNUAL' ? 'Anual' :
                                 appointment.serviceContract.serviceFrequency}
                              </p>
                            </div>
                            <Link
                              href={`/dashboard/service-contracts/${appointment.serviceContract.id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Ver contrato →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tasks Section */}
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Tareas Realizadas</h3>

                  {/* Add Task Input */}
                  {(appointment.status === "IN_PROGRESS" || appointment.status === "COMPLETED") && (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                        placeholder="Agregar tarea realizada..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button
                        onClick={addTask}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                      >
                        Agregar
                      </button>
                    </div>
                  )}

                  {/* Tasks List */}
                  <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No hay tareas registradas</p>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            task.completed
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskComplete(task.id)}
                            disabled={true} // Always disabled since they're auto-completed
                            className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(task.createdAt).toLocaleString('es-PR')}
                              {task.completedAt && ` - Completada: ${new Date(task.completedAt).toLocaleString('es-PR')}`}
                            </p>
                          </div>
                          {(appointment.status === "IN_PROGRESS" || appointment.status === "COMPLETED") && (
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Tasks Summary */}
                  {tasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tareas completadas:</span>
                        <span className="font-medium">
                          {tasks.filter(t => t.completed).length} de {tasks.length}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pending Tasks Section */}
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Tareas Pendientes</h3>

                  {/* Add Pending Task Input */}
                  {appointment.status !== "CANCELLED" && (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newPendingTask}
                        onChange={(e) => setNewPendingTask(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addPendingTask()}
                        placeholder="Agregar tarea pendiente..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button
                        onClick={addPendingTask}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                      >
                        Agregar
                      </button>
                    </div>
                  )}

                  {/* Pending Tasks List */}
                  <div className="space-y-2">
                    {pendingTasks.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No hay tareas pendientes</p>
                    ) : (
                      pendingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-yellow-50 border-yellow-200"
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => movePendingTaskToCompleted(task.id)}
                            disabled={appointment.status === "CANCELLED"}
                            className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-gray-900">{task.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Creada: {new Date(task.createdAt).toLocaleString('es-PR')}
                            </p>
                          </div>
                          {appointment.status !== "CANCELLED" && (
                            <button
                              onClick={() => deletePendingTask(task.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pending Tasks Summary */}
                  {pendingTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total de tareas pendientes:</span>
                        <span className="font-medium text-yellow-600">
                          {pendingTasks.length} {pendingTasks.length === 1 ? 'tarea' : 'tareas'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <FaUser className="mr-2" />
                    Información del Cliente
                  </h3>
                  {appointment.client && (
                    <div className="space-y-2">
                      <p className="font-medium">
                        {appointment.client.companyName || `${appointment.client.firstName} ${appointment.client.lastName}`}
                      </p>
                      {appointment.client.phone && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaPhone className="mr-2" />
                          {appointment.client.phone}
                        </p>
                      )}
                      {appointment.client.address && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaMapMarkerAlt className="mr-2" />
                          {appointment.client.address}
                        </p>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/clients/${appointment.client.id}`)}
                        className="text-blue-600 hover:underline text-sm mt-2"
                      >
                        Ver perfil completo →
                      </button>
                    </div>
                  )}
                </div>

                {appointment.technician && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold mb-4">Asignado a</h3>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {appointment.technician.firstName} {appointment.technician.lastName}
                      </p>
                      {appointment.technician.email && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaEnvelope className="mr-2" />
                          {appointment.technician.email}
                        </p>
                      )}
                      {appointment.technician.phone && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaPhone className="mr-2" />
                          {appointment.technician.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-4">Información de la Empresa</h3>
                  {appointment.company && (
                    <div className="space-y-2">
                      <p className="font-medium">{appointment.company.name}</p>
                      {appointment.company.phone && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaPhone className="mr-2" />
                          {appointment.company.phone}
                        </p>
                      )}
                      {appointment.company.email && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaEnvelope className="mr-2" />
                          {appointment.company.email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
      </div>
    </>
  );
}