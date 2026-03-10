"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTaskStatuses(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };
  return prisma.taskStatus.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });
}

export async function getTaskStatusUsageCounts() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const statuses = await prisma.taskStatus.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return statuses.map((s) => ({
    ...s,
    usageCount: s._count.tasks,
  }));
}

export async function createTaskStatus(label: string, color: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const maxOrder = await prisma.taskStatus.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const status = await prisma.taskStatus.create({
    data: { label, color, sortOrder: nextOrder },
  });

  revalidatePath("/dashboard");
  return status;
}

export async function updateTaskStatus(id: string, data: { label?: string; color?: string; isActive?: boolean; isDefault?: boolean }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  if (data.isDefault) {
    await prisma.taskStatus.updateMany({ data: { isDefault: false } });
  }

  const status = await prisma.taskStatus.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard");
  return status;
}

export async function deleteTaskStatus(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const usage = await prisma.dailyTask.count({ where: { statusId: id } });
  if (usage > 0) {
    throw new Error("Cannot delete a status that is in use. Deactivate it instead.");
  }

  await prisma.taskStatus.delete({ where: { id } });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function reorderTaskStatuses(ids: string[]) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.$transaction(
    ids.map((id, i) => prisma.taskStatus.update({ where: { id }, data: { sortOrder: i } }))
  );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function seedDefaultStatuses() {
  const existing = await prisma.taskStatus.count();
  if (existing > 0) return;

  const defaults = [
    { label: "To Do", color: "#6b7280", sortOrder: 0, isDefault: true },
    { label: "In Progress", color: "#3b82f6", sortOrder: 1 },
    { label: "Under Dev", color: "#8b5cf6", sortOrder: 2 },
    { label: "Under Review", color: "#f59e0b", sortOrder: 3 },
    { label: "Completed", color: "#10b981", sortOrder: 4 },
  ];

  for (const d of defaults) {
    await prisma.taskStatus.create({ data: d });
  }
}
