"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CalendarDayData {
  date: string;
  attendance: { status: string; reason: string | null } | null;
  update: { status: string; taskCount: number } | null;
}

export interface TeamCalendarDayData {
  date: string;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  remoteCount: number;
  halfDayCount: number;
  unmarkedCount: number;
  submittedCount: number;
  reviewedCount: number;
  totalMembers: number;
}

export async function getMyMonthlyCalendar(year: number, month: number): Promise<CalendarDayData[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const [attendances, updates] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: endDate },
      },
    }),
    prisma.dailyUpdate.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: { _count: { select: { tasks: true } } },
    }),
  ]);

  const attMap = new Map(attendances.map((a) => [a.date.toISOString().slice(0, 10), a]));
  const updMap = new Map(updates.map((u) => [u.date.toISOString().slice(0, 10), u]));

  const days: CalendarDayData[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const att = attMap.get(key);
    const upd = updMap.get(key);
    days.push({
      date: key,
      attendance: att ? { status: att.status, reason: att.reason } : null,
      update: upd ? { status: upd.status, taskCount: upd._count.tasks } : null,
    });
  }

  return days;
}

export async function getTeamMonthlyCalendar(year: number, month: number): Promise<TeamCalendarDayData[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const totalMembers = await prisma.user.count({ where: { role: "MEMBER", isActive: true } });

  const [attendances, updates] = await Promise.all([
    prisma.attendance.findMany({
      where: { date: { gte: startDate, lte: endDate }, user: { role: "MEMBER", isActive: true } },
    }),
    prisma.dailyUpdate.findMany({
      where: { date: { gte: startDate, lte: endDate }, user: { role: "MEMBER", isActive: true } },
    }),
  ]);

  const attByDate = new Map<string, typeof attendances>();
  for (const a of attendances) {
    const key = a.date.toISOString().slice(0, 10);
    if (!attByDate.has(key)) attByDate.set(key, []);
    attByDate.get(key)!.push(a);
  }

  const updByDate = new Map<string, typeof updates>();
  for (const u of updates) {
    const key = u.date.toISOString().slice(0, 10);
    if (!updByDate.has(key)) updByDate.set(key, []);
    updByDate.get(key)!.push(u);
  }

  const days: TeamCalendarDayData[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const dayAtt = attByDate.get(key) || [];
    const dayUpd = updByDate.get(key) || [];

    days.push({
      date: key,
      presentCount: dayAtt.filter((a) => a.status === "PRESENT").length,
      absentCount: dayAtt.filter((a) => a.status === "ABSENT").length,
      leaveCount: dayAtt.filter((a) => a.status === "LEAVE").length,
      remoteCount: dayAtt.filter((a) => a.status === "REMOTE").length,
      halfDayCount: dayAtt.filter((a) => a.status === "HALF_DAY").length,
      unmarkedCount: totalMembers - dayAtt.length,
      submittedCount: dayUpd.filter((u) => u.status === "SUBMITTED" || u.status === "REVIEWED").length,
      reviewedCount: dayUpd.filter((u) => u.status === "REVIEWED").length,
      totalMembers,
    });
  }

  return days;
}

export async function getTeamDayDetail(date: string) {
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
      dailyUpdates: {
        where: { date: dateObj },
        include: { tasks: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    attendance: u.attendances[0] || null,
    update: u.dailyUpdates[0] || null,
    taskCount: u.dailyUpdates[0]?.tasks.length || 0,
  }));
}
