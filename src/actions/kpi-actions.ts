"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateKPIInsights } from "@/lib/gemini";

export interface DomainBreakdown {
  domain: string;
  color: string;
  count: number;
  percentage: number;
}

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
  domains: DomainBreakdown[];
  primaryDomain: string;
}

const DOMAIN_PATTERNS: { domain: string; color: string; keywords: RegExp }[] = [
  { domain: "AI / ML", color: "#8b5cf6", keywords: /\b(ai|machine learning|ml|deep learning|neural|llm|gpt|gemini|model|training|nlp|ray|tensor|pytorch|langchain|openai|prompt|embedding|vector|rag|fine.?tun)/i },
  { domain: "Frontend", color: "#3b82f6", keywords: /\b(frontend|front.?end|react|next\.?js|vue|angular|css|tailwind|html|ui|ux|component|page|layout|responsive|browser|dom|jsx|tsx|styled|sass|scss)/i },
  { domain: "Backend", color: "#10b981", keywords: /\b(backend|back.?end|api|server|node|express|fastapi|django|flask|rest|graphql|endpoint|middleware|controller|route|prisma|database|sql|postgres|mongo|redis|orm)/i },
  { domain: "Mobile", color: "#f59e0b", keywords: /\b(mobile|android|ios|react.?native|flutter|swift|kotlin|app.?store|play.?store|expo)/i },
  { domain: "DevOps", color: "#ef4444", keywords: /\b(devops|deploy|ci.?cd|docker|kubernetes|k8s|aws|azure|gcp|cloud|pipeline|jenkins|github.?actions|terraform|nginx|linux|server|infra|monitoring)/i },
  { domain: "Testing / QA", color: "#ec4899", keywords: /\b(test|testing|qa|quality|bug|fix|debug|jest|cypress|playwright|selenium|unit.?test|e2e|integration.?test)/i },
  { domain: "Design", color: "#06b6d4", keywords: /\b(design|figma|sketch|wireframe|mockup|prototype|typography|branding|logo|illustration|photoshop|adobe)/i },
  { domain: "Documentation", color: "#64748b", keywords: /\b(document|readme|docs|wiki|guide|tutorial|write.?up|specification|requirement)/i },
  { domain: "Research", color: "#a855f7", keywords: /\b(research|study|learn|course|tutorial|video|training|certification|explore|investigate|poc|proof.?of.?concept)/i },
  { domain: "Management", color: "#f97316", keywords: /\b(meeting|standup|review|planning|sprint|scrum|agile|jira|ticket|task.?assign|coordination|client|stakeholder)/i },
];

function classifyTaskDomains(taskTexts: string[]): DomainBreakdown[] {
  const domainCounts: Record<string, { color: string; count: number }> = {};

  for (const text of taskTexts) {
    const plain = text.replace(/<[^>]*>/g, " ");
    const matched = new Set<string>();

    for (const pattern of DOMAIN_PATTERNS) {
      if (pattern.keywords.test(plain) && !matched.has(pattern.domain)) {
        matched.add(pattern.domain);
        if (!domainCounts[pattern.domain]) {
          domainCounts[pattern.domain] = { color: pattern.color, count: 0 };
        }
        domainCounts[pattern.domain].count++;
      }
    }

    if (matched.size === 0) {
      if (!domainCounts["General"]) {
        domainCounts["General"] = { color: "#94a3b8", count: 0 };
      }
      domainCounts["General"].count++;
    }
  }

  const total = taskTexts.length || 1;
  return Object.entries(domainCounts)
    .map(([domain, { color, count }]) => ({
      domain,
      color,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
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
            include: {
              taskStatus: true,
              subTasks: true,
            },
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

    const taskTexts = allTasks.map((t) => {
      const subTexts = t.subTasks?.map((st: any) => st.text).join(" ") || "";
      return `${t.text} ${subTexts}`;
    });
    const domains = classifyTaskDomains(taskTexts);
    const primaryDomain = domains.length > 0 ? domains[0].domain : "General";

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
      domains,
      primaryDomain,
    };
  });
}

export async function generateMemberInsights(kpi: MemberKPI): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const domainSummary = kpi.domains.length > 0
    ? kpi.domains.map((d) => `${d.domain}: ${d.count} tasks (${d.percentage}%)`).join(", ")
    : "Not enough data to classify";

  const prompt = `You are a professional HR/Team Lead KPI analyst for a software development team.

Analyze the following KPI data for team member "${kpi.name}" over the last 30 days and provide actionable insights.

KPI Data:
- Attendance Rate: ${kpi.attendanceRate}% (Present: ${kpi.presentDays} days, Remote: ${kpi.remoteDays} days, Absent: ${kpi.absentDays} days, Leave: ${kpi.leaveDays} days)
- Task Submission Rate: ${kpi.taskSubmissionRate}% (${kpi.totalUpdates} updates submitted out of ${kpi.totalWorkDays} work days)
- Total Tasks Logged: ${kpi.totalTasks}
- Average Tasks/Day: ${kpi.avgTasksPerDay}
- Task Completion Rate: ${kpi.taskCompletionRate}% (${kpi.completedTasks} completed out of ${kpi.totalTasks})
- On-Time Submission Rate: ${kpi.onTimeRate}%
- Primary Work Domain: ${kpi.primaryDomain}
- Work Domain Breakdown: ${domainSummary}

Provide your analysis in this format:
1. **Performance Rating** (Excellent/Good/Average/Needs Improvement)
2. **Primary Focus Area**: Based on their work domains, what is this member's specialization and how focused are they?
3. **Key Strengths** (2-3 bullet points)
4. **Areas for Improvement** (2-3 bullet points)
5. **Actionable Recommendations** (2-3 specific recommendations considering their domain)
6. **One-Line Summary** suitable for management reporting

Keep it concise, professional, and constructive. No longer than 300 words total.`;

  return generateKPIInsights(prompt);
}

export async function generateTeamSummary(kpis: MemberKPI[]): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const teamData = kpis.map((k) =>
    `- ${k.name} [${k.primaryDomain}]: Attendance ${k.attendanceRate}%, Submission ${k.taskSubmissionRate}%, Tasks ${k.totalTasks}, Completion ${k.taskCompletionRate}%`
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
