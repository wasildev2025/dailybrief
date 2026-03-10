"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface DateRangeMemberSummary {
  userId: string;
  name: string;
  totalDays: number;
  daysSubmitted: number;
  totalTasks: number;
  completedTasks: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  remoteDays: number;
}

export interface DateRangeReport {
  startDate: string;
  endDate: string;
  totalWorkDays: number;
  members: DateRangeMemberSummary[];
  dailyBreakdown: { date: string; submittedCount: number; totalMembers: number }[];
}

export async function generateDateRangeReport(startDate: string, endDate: string): Promise<DateRangeReport> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const start = new Date(startDate);
  const end = new Date(endDate);

  const members = await prisma.user.findMany({
    where: { role: "MEMBER", isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      dailyUpdates: {
        where: { date: { gte: start, lte: end } },
        include: {
          tasks: { include: { taskStatus: true } },
        },
      },
      attendances: {
        where: { date: { gte: start, lte: end } },
      },
    },
  });

  const allDates: string[] = [];
  const d = new Date(start);
  while (d <= end) {
    allDates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  const totalWorkDays = allDates.length;

  const completedLabels = ["completed", "done"];

  const memberSummaries: DateRangeMemberSummary[] = members.map((m) => {
    const allTasks = m.dailyUpdates.flatMap((u) => u.tasks);
    const completedTasks = allTasks.filter(
      (t) => t.taskStatus && completedLabels.includes(t.taskStatus.label.toLowerCase())
    ).length;

    return {
      userId: m.id,
      name: m.name,
      totalDays: totalWorkDays,
      daysSubmitted: m.dailyUpdates.filter((u) => u.status === "SUBMITTED" || u.status === "REVIEWED" || u.status === "FINALIZED").length,
      totalTasks: allTasks.length,
      completedTasks,
      presentDays: m.attendances.filter((a) => a.status === "PRESENT").length,
      absentDays: m.attendances.filter((a) => a.status === "ABSENT").length,
      leaveDays: m.attendances.filter((a) => a.status === "LEAVE").length,
      remoteDays: m.attendances.filter((a) => a.status === "REMOTE").length,
    };
  });

  const dailyUpdatesAll = await prisma.dailyUpdate.groupBy({
    by: ["date"],
    where: {
      date: { gte: start, lte: end },
      status: { in: ["SUBMITTED", "REVIEWED", "FINALIZED"] },
      user: { role: "MEMBER" },
    },
    _count: true,
  });

  const dailyMap = new Map(dailyUpdatesAll.map((d) => [d.date.toISOString().split("T")[0], d._count]));

  const dailyBreakdown = allDates.map((date) => ({
    date,
    submittedCount: dailyMap.get(date) || 0,
    totalMembers: members.length,
  }));

  return {
    startDate,
    endDate,
    totalWorkDays,
    members: memberSummaries,
    dailyBreakdown,
  };
}
