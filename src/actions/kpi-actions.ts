"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateKPIInsights } from "@/lib/gemini";

export interface MemberKPI {
  userId: string;
  name: string;
  email: string;
  attendanceRate: number;
  presentDays: number;
  remoteDays: number;
  absentDays: number;
  leaveDays: number;
  totalWorkDays: number;
  taskSubmissionRate: number;
  totalUpdates: number;
  totalTasks: number;
  avgTasksPerDay: number;
  completedTasks: number;
  taskCompletionRate: number;
  onTimeSubmissions: number;
  onTimeRate: number;
}

export async function getTeamKPIData(days = 30): Promise<MemberKPI[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const members = await prisma.user.findMany({
    where: { isActive: true, role: "MEMBER" },
    orderBy: { displayOrder: "asc" },
    include: {
      attendances: { where: { date: { gte: since } } },
      dailyUpdates: {
        where: { date: { gte: since } },
        include: {
          tasks: {
            include: { taskStatus: true },
          },
        },
      },
    },
  });

  const completedLabels = ["completed", "done"];

  return members.map((member) => {
    const attendances = member.attendances;
    const updates = member.dailyUpdates;

    const presentDays = attendances.filter((a) => a.status === "PRESENT").length;
    const remoteDays = attendances.filter((a) => a.status === "REMOTE").length;
    const absentDays = attendances.filter((a) => a.status === "ABSENT").length;
    const leaveDays = attendances.filter((a) => a.status === "LEAVE").length;
    const totalWorkDays = attendances.length || 1;
    const attendanceRate = Math.round(((presentDays + remoteDays) / totalWorkDays) * 100);

    const totalUpdates = updates.length;
    const allTasks = updates.flatMap((u) => u.tasks);
    const totalTasks = allTasks.length;
    const avgTasksPerDay = totalUpdates > 0 ? Math.round((totalTasks / totalUpdates) * 10) / 10 : 0;

    const submittedUpdates = updates.filter((u) => u.status === "SUBMITTED" || u.status === "REVIEWED");
    const taskSubmissionRate = totalWorkDays > 0 ? Math.round((submittedUpdates.length / totalWorkDays) * 100) : 0;

    const completedTasks = allTasks.filter(
      (t) => t.taskStatus && completedLabels.includes(t.taskStatus.label.toLowerCase())
    ).length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const onTimeSubmissions = submittedUpdates.length;
    const onTimeRate = totalWorkDays > 0 ? Math.round((onTimeSubmissions / totalWorkDays) * 100) : 0;

    return {
      userId: member.id,
      name: member.name,
      email: member.email,
      attendanceRate,
      presentDays,
      remoteDays,
      absentDays,
      leaveDays,
      totalWorkDays,
      taskSubmissionRate,
      totalUpdates,
      totalTasks,
      avgTasksPerDay,
      completedTasks,
      taskCompletionRate,
      onTimeSubmissions,
      onTimeRate,
    };
  });
}

export async function generateMemberInsights(kpi: MemberKPI): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const prompt = `You are a professional HR/Team Lead KPI analyst for a software development team.

Analyze the following KPI data for team member "${kpi.name}" over the last 30 days and provide actionable insights.

KPI Data:
- Attendance Rate: ${kpi.attendanceRate}% (Present: ${kpi.presentDays} days, Remote: ${kpi.remoteDays} days, Absent: ${kpi.absentDays} days, Leave: ${kpi.leaveDays} days)
- Task Submission Rate: ${kpi.taskSubmissionRate}% (${kpi.totalUpdates} updates submitted out of ${kpi.totalWorkDays} work days)
- Total Tasks Logged: ${kpi.totalTasks}
- Average Tasks/Day: ${kpi.avgTasksPerDay}
- Task Completion Rate: ${kpi.taskCompletionRate}% (${kpi.completedTasks} completed out of ${kpi.totalTasks})
- On-Time Submission Rate: ${kpi.onTimeRate}%

Provide your analysis in this format:
1. **Performance Rating** (Excellent/Good/Average/Needs Improvement)
2. **Key Strengths** (2-3 bullet points)
3. **Areas for Improvement** (2-3 bullet points)
4. **Actionable Recommendations** (2-3 specific recommendations)
5. **One-Line Summary** suitable for management reporting

Keep it concise, professional, and constructive. No longer than 250 words total.`;

  return generateKPIInsights(prompt);
}

export async function generateTeamSummary(kpis: MemberKPI[]): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const teamData = kpis.map((k) =>
    `- ${k.name}: Attendance ${k.attendanceRate}%, Submission ${k.taskSubmissionRate}%, Tasks ${k.totalTasks}, Completion ${k.taskCompletionRate}%`
  ).join("\n");

  const avgAttendance = Math.round(kpis.reduce((s, k) => s + k.attendanceRate, 0) / kpis.length);
  const avgSubmission = Math.round(kpis.reduce((s, k) => s + k.taskSubmissionRate, 0) / kpis.length);
  const totalTasks = kpis.reduce((s, k) => s + k.totalTasks, 0);

  const prompt = `You are a professional HR/Team Lead analyst for a software development team.

Provide a brief team performance summary based on the last 30 days of KPI data.

Team Averages:
- Average Attendance Rate: ${avgAttendance}%
- Average Task Submission Rate: ${avgSubmission}%
- Total Tasks Logged (Team): ${totalTasks}

Individual Performance:
${teamData}

Provide:
1. **Team Health Score** (1-10)
2. **Top Performer** with brief reason
3. **Team Strengths** (2 points)
4. **Team Improvement Areas** (2 points)
5. **Recommendation for Management** (1 paragraph)

Keep it concise, professional, and under 200 words.`;

  return generateKPIInsights(prompt);
}
