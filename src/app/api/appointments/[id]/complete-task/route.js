import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

export async function POST(request, context) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID es requerido" },
        { status: 400 }
      );
    }

    // Get the appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Process tasks
    let pendingTasks = appointment.pendingTasks || [];
    let completedTasks = appointment.tasks || [];

    // Find the task to move
    const taskToMove = pendingTasks.find((task) => task.id === taskId);

    if (!taskToMove) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Remove from pending tasks
    pendingTasks = pendingTasks.filter((task) => task.id !== taskId);

    // Add to completed tasks with completion time
    const completedTask = {
      ...taskToMove,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    completedTasks.push(completedTask);

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        pendingTasks: pendingTasks.length > 0 ? pendingTasks : null,
        tasks: completedTasks,
      },
    });

    return NextResponse.json({
      message: "Tarea completada exitosamente",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error completing task:", error);
    return NextResponse.json(
      { error: "Error al completar la tarea" },
      { status: 500 }
    );
  }
}