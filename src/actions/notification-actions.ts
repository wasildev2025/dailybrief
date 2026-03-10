"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

export async function getMyNotifications(limit = 20): Promise<NotificationItem[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session?.user) return 0;

  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "warning" | "success" | "task" = "info",
  link?: string
) {
  await prisma.notification.create({
    data: { userId, title, message, type, link: link || null },
  });
}

export async function createNotificationsForAdmins(
  title: string,
  message: string,
  type: "info" | "warning" | "success" | "task" = "info",
  link?: string
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title,
        message,
        type,
        link: link || null,
      })),
    });
  }
}

export async function notifyPendingSubmissions() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const membersWithoutUpdates = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      isActive: true,
      dailyUpdates: { none: { date: today, status: { in: ["SUBMITTED", "REVIEWED", "FINALIZED"] } } },
    },
    select: { id: true, name: true },
  });

  for (const member of membersWithoutUpdates) {
    await prisma.notification.create({
      data: {
        userId: member.id,
        title: "Daily Update Pending",
        message: "You haven't submitted your daily update for today. Please submit your tasks.",
        type: "warning",
        link: "/dashboard/member",
      },
    });
  }

  return { sent: membersWithoutUpdates.length, members: membersWithoutUpdates.map((m) => m.name) };
}
