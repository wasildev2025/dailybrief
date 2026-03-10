"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeamKPIData, generateMemberInsights, generateTeamSummary, MemberKPI, DomainBreakdown } from "@/actions/kpi-actions";
import { toast } from "sonner";
import {
  Loader2,
  BarChart3,
  TrendingUp,
  UserCheck,
  ClipboardCheck,
  Target,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Users,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function KPIPage() {
  const [kpis, setKpis] = useState<MemberKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [teamSummary, setTeamSummary] = useState<string | null>(null);
  const [loadingTeamSummary, setLoadingTeamSummary] = useState(false);

  useEffect(() => { loadKPIs(); }, []);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await getTeamKPIData(30);
      setKpis(data);
    } catch {
      toast.error("Failed to load KPI data");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async (kpi: MemberKPI) => {
    setLoadingInsights((prev) => ({ ...prev, [kpi.userId]: true }));
    try {
      const result = await generateMemberInsights(kpi);
      setInsights((prev) => ({ ...prev, [kpi.userId]: result }));
      setExpanded((prev) => ({ ...prev, [kpi.userId]: true }));
    } catch {
      toast.error(`Failed to generate insights for ${kpi.name}`);
    } finally {
      setLoadingInsights((prev) => ({ ...prev, [kpi.userId]: false }));
    }
  };

  const handleTeamSummary = async () => {
    setLoadingTeamSummary(true);
    try {
      const result = await generateTeamSummary(kpis);
      setTeamSummary(result);
    } catch {
      toast.error("Failed to generate team summary");
    } finally {
      setLoadingTeamSummary(false);
    }
  };

  const avgAttendance = kpis.length > 0 ? Math.round(kpis.reduce((s, k) => s + k.attendanceRate, 0) / kpis.length) : 0;
  const avgSubmission = kpis.length > 0 ? Math.round(kpis.reduce((s, k) => s + k.taskSubmissionRate, 0) / kpis.length) : 0;
  const totalTasks = kpis.reduce((s, k) => s + k.totalTasks, 0);
  const topPerformer = kpis.length > 0 ? [...kpis].sort((a, b) => (b.attendanceRate + b.taskSubmissionRate + b.taskCompletionRate) - (a.attendanceRate + a.taskSubmissionRate + a.taskCompletionRate))[0] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Team KPI Dashboard
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Last 30 days performance metrics with AI-powered insights</p>
        </div>
        <Button
          onClick={handleTeamSummary}
          disabled={loadingTeamSummary}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          size="sm"
        >
          {loadingTeamSummary ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Brain className="h-3.5 w-3.5 mr-1.5" />}
          AI Team Summary
        </Button>
      </div>

      {/* Team Summary AI */}
      {teamSummary && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-semibold text-indigo-900 flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-600" />
              AI Team Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none">
              {teamSummary.split("**").map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard title="Team Attendance" value={`${avgAttendance}%`} icon={UserCheck} color="emerald" />
        <KPICard title="Submission Rate" value={`${avgSubmission}%`} icon={ClipboardCheck} color="blue" />
        <KPICard title="Total Tasks" value={totalTasks.toString()} icon={Target} color="violet" />
        <KPICard title="Top Performer" value={topPerformer?.name.split(" ").pop() || "—"} icon={TrendingUp} color="amber" />
      </div>

      {/* Individual KPIs */}
      <div className="space-y-3">
        {kpis.map((kpi) => (
          <Card key={kpi.userId} className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [kpi.userId]: !prev[kpi.userId] }))}
                    className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600"
                  >
                    {expanded[kpi.userId] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-200 flex items-center justify-center text-[12px] font-bold text-indigo-700">
                    {kpi.name.split(" ").pop()?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-gray-900">{kpi.name}</p>
                      {kpi.primaryDomain && (
                        <span
                          className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: kpi.domains[0]?.color || "#94a3b8" }}
                        >
                          {kpi.primaryDomain}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">{kpi.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini metric pills */}
                  <MetricPill label="Attendance" value={`${kpi.attendanceRate}%`} color={kpi.attendanceRate >= 80 ? "emerald" : kpi.attendanceRate >= 60 ? "amber" : "red"} />
                  <MetricPill label="Submission" value={`${kpi.taskSubmissionRate}%`} color={kpi.taskSubmissionRate >= 80 ? "emerald" : kpi.taskSubmissionRate >= 60 ? "amber" : "red"} />
                  <MetricPill label="Completion" value={`${kpi.taskCompletionRate}%`} color={kpi.taskCompletionRate >= 80 ? "emerald" : kpi.taskCompletionRate >= 50 ? "amber" : "red"} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateInsight(kpi)}
                    disabled={loadingInsights[kpi.userId]}
                    className="text-[11px] h-7"
                  >
                    {loadingInsights[kpi.userId] ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    AI Insight
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expanded[kpi.userId] && (
              <CardContent className="px-5 pb-4">
                {/* Detailed Metrics */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-2 mb-3">
                  <DetailMetric label="Present" value={kpi.presentDays} />
                  <DetailMetric label="Remote" value={kpi.remoteDays} />
                  <DetailMetric label="Absent" value={kpi.absentDays} />
                  <DetailMetric label="Leave" value={kpi.leaveDays} />
                  <DetailMetric label="Total Tasks" value={kpi.totalTasks} />
                  <DetailMetric label="Avg/Day" value={kpi.avgTasksPerDay} />
                </div>

                {/* Work Domain Breakdown */}
                {kpi.domains.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Work Domains</p>
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-2">
                      {kpi.domains.map((d) => (
                        <div
                          key={d.domain}
                          className="h-full transition-all duration-500"
                          style={{ backgroundColor: d.color, width: `${d.percentage}%`, minWidth: d.percentage > 0 ? "4px" : "0" }}
                          title={`${d.domain}: ${d.percentage}%`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {kpi.domains.map((d) => (
                        <div key={d.domain} className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-[11px] text-gray-600">{d.domain}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{d.count} ({d.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress bars */}
                <div className="space-y-2.5 mb-3">
                  <ProgressBar label="Attendance Rate" value={kpi.attendanceRate} color="emerald" />
                  <ProgressBar label="Task Submission Rate" value={kpi.taskSubmissionRate} color="blue" />
                  <ProgressBar label="Task Completion Rate" value={kpi.taskCompletionRate} color="violet" />
                </div>

                {/* AI Insights */}
                {insights[kpi.userId] && (
                  <div className="bg-gradient-to-r from-violet-50/50 via-indigo-50/50 to-purple-50/50 rounded-xl p-4 border border-indigo-100/50 mt-3">
                    <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Insights
                    </p>
                    <div className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {insights[kpi.userId].split("**").map((part, i) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  const colorMap: Record<string, { icon: string; bg: string }> = {
    emerald: { icon: "text-emerald-600", bg: "bg-emerald-50" },
    blue: { icon: "text-blue-600", bg: "bg-blue-50" },
    violet: { icon: "text-violet-600", bg: "bg-violet-50" },
    amber: { icon: "text-amber-600", bg: "bg-amber-50" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", c.bg)}>
          <Icon className={cn("h-5 w-5", c.icon)} />
        </div>
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className={cn("hidden sm:flex flex-col items-center px-2.5 py-1 rounded-lg text-[10px]", colorMap[color])}>
      <span className="font-bold">{value}</span>
      <span className="font-medium opacity-70">{label}</span>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center py-2 px-2 rounded-lg bg-gray-50">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-500">{label}</span>
        <span className="text-[11px] font-semibold text-gray-700">{value}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", colorMap[color])} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}
