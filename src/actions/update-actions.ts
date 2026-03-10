"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUpdateForDate(date: string, userId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetUserId = userId || session.user.id;

  if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const update = await prisma.dailyUpdate.findUnique({
    where: {
      userId_date: {
        userId: targetUserId,
        date: new Date(date),
      },
    },
    include: {
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: { subTasks: { orderBy: { sortOrder: "asc" } } },
      },
      adminNotes: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      user: { select: { name: true, email: true } },
    },
  });

  return update;
}

export interface TaskInput {
  text: string;
  subTasks: string[];
}

export async function saveUpdate(
  date: string,
  tasks: TaskInput[],
  status: "DRAFT" | "SUBMITTED"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const filteredTasks = tasks.filter((t) => t.text.trim() !== "");
  if (status === "SUBMITTED" && filteredTasks.length === 0) {
    throw new Error("Cannot submit an update with no tasks");
  }

  const dateObj = new Date(date);

  const locked = await prisma.lockedDate.findUnique({
    where: { date: dateObj },
  });
  if (locked) throw new Error("This date has been locked by admin");

  const existing = await prisma.dailyUpdate.findUnique({
    where: {
      userId_date: { userId: session.user.id, date: dateObj },
    },
  });

  if (existing && existing.status === "REVIEWED" && session.user.role !== "ADMIN") {
    throw new Error("This update has been reviewed and cannot be edited");
  }

  const update = await prisma.dailyUpdate.upsert({
    where: {
      userId_date: { userId: session.user.id, date: dateObj },
    },
    create: {
      userId: session.user.id,
      date: dateObj,
      status,
    },
    update: {
      status,
    },
  });

  await prisma.dailyTask.deleteMany({
    where: { dailyUpdateId: update.id },
  });

  for (let i = 0; i < filteredTasks.length; i++) {
    const task = filteredTasks[i];
    const created = await prisma.dailyTask.create({
      data: {
        dailyUpdateId: update.id,
        text: task.text.trim(),
        sortOrder: i,
      },
    });

    const filteredSubs = task.subTasks.filter((s) => s.trim() !== "");
    if (filteredSubs.length > 0) {
      await prisma.subTask.createMany({
        data: filteredSubs.map((text, si) => ({
          dailyTaskId: created.id,
          text: text.trim(),
          sortOrder: si,
        })),
      });
    }
  }

  revalidatePath("/dashboard");
  return { success: true, id: update.id };
}

export async function adminSaveUpdate(
  updateId: string,
  tasks: TaskInput[],
  status?: "DRAFT" | "SUBMITTED" | "REVIEWED"
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const filteredTasks = tasks.filter((t) => t.text.trim() !== "");

  const updateData: any = {};
  if (status) updateData.status = status;

  await prisma.dailyUpdate.update({
    where: { id: updateId },
    data: updateData,
  });

  await prisma.dailyTask.deleteMany({
    where: { dailyUpdateId: updateId },
  });

  for (let i = 0; i < filteredTasks.length; i++) {
    const task = filteredTasks[i];
    const created = await prisma.dailyTask.create({
      data: {
        dailyUpdateId: updateId,
        text: task.text.trim(),
        sortOrder: i,
      },
    });

    const filteredSubs = task.subTasks.filter((s) => s.trim() !== "");
    if (filteredSubs.length > 0) {
      await prisma.subTask.createMany({
        data: filteredSubs.map((text, si) => ({
          dailyTaskId: created.id,
          text: text.trim(),
          sortOrder: si,
        })),
      });
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function addAdminNote(updateId: string, note: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.adminNote.create({
    data: {
      dailyUpdateId: updateId,
      note,
      createdById: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getAllUpdatesForDate(date: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const dateObj = new Date(date);

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      dailyUpdates: {
        where: { date: dateObj },
        include: {
          tasks: {
            orderBy: { sortOrder: "asc" },
            include: { subTasks: { orderBy: { sortOrder: "asc" } } },
          },
          adminNotes: {
            include: { createdBy: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  return users.map((user) => ({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      displayOrder: user.displayOrder,
    },
    update: user.dailyUpdates[0] || null,
  }));
}

export async function getMyUpdates(limit = 30) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.dailyUpdate.findMany({
    where: { userId: session.user.id },
    include: {
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: { subTasks: { orderBy: { sortOrder: "asc" } } },
      },
    },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function lockDate(date: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const dateObj = new Date(date);

  await prisma.lockedDate.upsert({
    where: { date: dateObj },
    create: { date: dateObj, lockedById: session.user.id },
    update: {},
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function unlockDate(date: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.lockedDate.delete({
    where: { date: new Date(date) },
  }).catch(() => {});

  revalidatePath("/dashboard");
  return { success: true };
}

export async function isDateLocked(date: string) {
  const locked = await prisma.lockedDate.findUnique({
    where: { date: new Date(date) },
  });
  return !!locked;
}

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalMembers, submittedToday, draftToday, reviewedToday] =
    await Promise.all([
      prisma.user.count({ where: { role: "MEMBER", isActive: true } }),
      prisma.dailyUpdate.count({
        where: { date: today, status: "SUBMITTED" },
      }),
      prisma.dailyUpdate.count({
        where: { date: today, status: "DRAFT" },
      }),
      prisma.dailyUpdate.count({
        where: { date: today, status: "REVIEWED" },
      }),
    ]);

  return {
    totalMembers,
    submittedToday,
    draftToday,
    reviewedToday,
    pendingToday: totalMembers - submittedToday - reviewedToday,
  };
}

export async function copyPreviousDayTasks(date: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetDate = new Date(date);

  const previousUpdate = await prisma.dailyUpdate.findFirst({
    where: {
      userId: session.user.id,
      date: { lt: targetDate },
    },
    include: {
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: { subTasks: { orderBy: { sortOrder: "asc" } } },
      },
    },
    orderBy: { date: "desc" },
  });

  if (!previousUpdate || previousUpdate.tasks.length === 0) {
    return { tasks: [] as TaskInput[] };
  }

  return {
    tasks: previousUpdate.tasks.map((t) => ({
      text: t.text,
      subTasks: t.subTasks.map((s) => s.text),
    })),
  };
}
