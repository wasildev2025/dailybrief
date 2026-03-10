"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/actions/activity-actions";

type AttendanceStatusType = "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY" | "REMOTE";

const REASON_REQUIRED: AttendanceStatusType[] = ["ABSENT", "LEAVE", "HALF_DAY"];

export async function getAttendanceForDate(date: string, userId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetUserId = userId || session.user.id;
  if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return prisma.attendance.findUnique({
    where: {
      userId_date: { userId: targetUserId, date: new Date(date) },
    },
    include: { user: { select: { name: true, email: true } } },
  });
}

export async function saveAttendance(
  date: string,
  status: AttendanceStatusType,
  reason?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (REASON_REQUIRED.includes(status) && (!reason || !reason.trim())) {
    throw new Error(`Reason is required for ${status.replace("_", " ").toLowerCase()}`);
  }

  const dateObj = new Date(date);

  const locked = await prisma.lockedDate.findUnique({ where: { date: dateObj } });
  if (locked) throw new Error("This date has been locked by admin");

  await prisma.attendance.upsert({
    where: {
      userId_date: { userId: session.user.id, date: dateObj },
    },
    create: {
      userId: session.user.id,
      date: dateObj,
      status,
      reason: reason?.trim() || null,
    },
    update: {
      status,
      reason: reason?.trim() || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function adminSaveAttendance(
  userId: string,
  date: string,
  status: AttendanceStatusType,
  reason?: string
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (REASON_REQUIRED.includes(status) && (!reason || !reason.trim())) {
    throw new Error(`Reason is required for ${status.replace("_", " ").toLowerCase()}`);
  }

  const dateObj = new Date(date);

  await prisma.attendance.upsert({
    where: {
      userId_date: { userId, date: dateObj },
    },
    create: {
      userId,
      date: dateObj,
      status,
      reason: reason?.trim() || null,
    },
    update: {
      status,
      reason: reason?.trim() || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getAllAttendanceForDate(date: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const dateObj = new Date(date);

  const users = await prisma.user.findMany({
    where: { isActive: true, role: "MEMBER" },
    orderBy: { displayOrder: "asc" },
    include: {
      attendances: { where: { date: dateObj } },
    },
  });

  return users.map((user) => ({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      displayOrder: user.displayOrder,
    },
    attendance: user.attendances[0] || null,
  }));
}

export async function getAttendanceStats(date: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const dateObj = new Date(date);

  const [present, absent, leave, halfDay, remote, totalMembers] = await Promise.all([
    prisma.attendance.count({ where: { date: dateObj, status: "PRESENT" } }),
    prisma.attendance.count({ where: { date: dateObj, status: "ABSENT" } }),
    prisma.attendance.count({ where: { date: dateObj, status: "LEAVE" } }),
    prisma.attendance.count({ where: { date: dateObj, status: "HALF_DAY" } }),
    prisma.attendance.count({ where: { date: dateObj, status: "REMOTE" } }),
    prisma.user.count({ where: { role: "MEMBER", isActive: true } }),
  ]);

  return { present, absent, leave, halfDay, remote, totalMembers, unmarked: totalMembers - present - absent - leave - halfDay - remote };
}

export interface BulkAttendanceEntry {
  userId: string;
  status: AttendanceStatusType;
  reason?: string;
}

export async function bulkSaveAttendance(date: string, entries: BulkAttendanceEntry[]) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const dateObj = new Date(date);

  const validEntries = entries.filter((e) => e.status);

  for (const entry of validEntries) {
    if (REASON_REQUIRED.includes(entry.status) && (!entry.reason || !entry.reason.trim())) {
      throw new Error(`Reason is required for ${entry.status.replace("_", " ").toLowerCase()}`);
    }
  }

  await prisma.$transaction(
    validEntries.map((entry) =>
      prisma.attendance.upsert({
        where: { userId_date: { userId: entry.userId, date: dateObj } },
        create: {
          userId: entry.userId,
          date: dateObj,
          status: entry.status,
          reason: entry.reason?.trim() || null,
        },
        update: {
          status: entry.status,
          reason: entry.reason?.trim() || null,
        },
      })
    )
  );

  await logActivity("bulk_attendance", "attendance", date, `Saved attendance for ${validEntries.length} members on ${date}`);

  revalidatePath("/dashboard");
  return { success: true, count: validEntries.length };
}
