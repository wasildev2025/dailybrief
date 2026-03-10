"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function logActivity(
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action,
      entity,
      entityId: entityId || null,
      details: details || null,
    },
  });
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: Date;
  user: { name: string; email: string; role: string };
}

export async function getRecentActivity(limit = 50): Promise<ActivityItem[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  return prisma.activityLog.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUserActivity(userId: string, limit = 30): Promise<ActivityItem[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  return prisma.activityLog.findMany({
    where: { userId },
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
