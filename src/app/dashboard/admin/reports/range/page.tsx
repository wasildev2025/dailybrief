"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateDateRangeReport, DateRangeReport } from "@/actions/report-actions";
import { toast } from "sonner";
import {
  Loader2, CalendarRange, TrendingUp, Users, FileText,
  CheckCircle, UserCheck, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

export default function DateRangeReportPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<DateRangeReport | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) { toast.error("Select both dates"); return; }
    if (new Date(startDate) > new Date(endDate)) { toast.error("Start date must be before end date"); return; }

    setLoading(true);
    try {
      const data = await generateDateRangeReport(startDate, endDate);
      setReport(data);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportXlsx = () => {
    if (!report) return;

    const summaryRows = report.members.map((m) => ({
      "Member": m.name,
      "Days Submitted": m.daysSubmitted,
      "Total Days": m.totalDays,
      "Submission %": Math.round((m.daysSubmitted / m.totalDays) * 100),
      "Total Tasks": m.totalTasks,
      "Completed Tasks": m.completedTasks,
      "Completion %": m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0,
      "Present": m.presentDays,
      "Remote": m.remoteDays,
      "Leave": m.leaveDays,
      "Absent": m.absentDays,
    }));

    const dailyRows = report.dailyBreakdown.map((d) => ({
      "Date": d.date,
      "Submitted": d.submittedCount,
      "Total Members": d.totalMembers,
      "Submission %": Math.round((d.submittedCount / d.totalMembers) * 100),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Member Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), "Daily Breakdown");
    XLSX.writeFile(wb, `report-${startDate}-to-${endDate}.xlsx`);
    toast.success("Excel file downloaded");
  };

  const avgSubmission = report ? Math.round(report.members.reduce((s, m) => s + (m.daysSubmitted / m.totalDays) * 100, 0) / report.members.length) : 0;
  const totalTasks = report ? report.members.reduce((s, m) => s + m.totalTasks, 0) : 0;
  const avgAttendance = report ? Math.round(report.members.reduce((s, m) => s + ((m.presentDays + m.remoteDays) / m.totalDays) * 100, 0) / report.members.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-indigo-600" />
          Date Range Report
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Generate weekly or monthly summary reports across your team</p>
      </div>

      {/* Date Range Picker */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-sm w-44" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-sm w-44" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                const d = new Date(); d.setDate(d.getDate() - 7);
                setStartDate(d.toISOString().split("T")[0]);
                setEndDate(new Date().toISOString().split("T")[0]);
              }} variant="outline" size="sm" className="text-[11px] h-9">Last 7 Days</Button>
              <Button onClick={() => {
                const d = new Date(); d.setDate(d.getDate() - 30);
                setStartDate(d.toISOString().split("T")[0]);
                setEndDate(new Date().toISOString().split("T")[0]);
              }} variant="outline" size="sm" className="text-[11px] h-9">Last 30 Days</Button>
              <Button onClick={() => {
                const d = new Date(); d.setDate(1);
                setStartDate(d.toISOString().split("T")[0]);
                setEndDate(new Date().toISOString().split("T")[0]);
              }} variant="outline" size="sm" className="text-[11px] h-9">This Month</Button>
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9">
              {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-1.5" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <OverviewCard title="Period" value={`${report.totalWorkDays} days`} icon={CalendarRange} color="indigo" />
            <OverviewCard title="Avg Submission" value={`${avgSubmission}%`} icon={FileText} color="blue" />
            <OverviewCard title="Total Tasks" value={totalTasks.toString()} icon={CheckCircle} color="emerald" />
            <OverviewCard title="Avg Attendance" value={`${avgAttendance}%`} icon={UserCheck} color="violet" />
          </div>

          {/* Member Summary */}
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  Member Summary
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportXlsx} className="text-[11px] h-7">
                  <Download className="h-3.5 w-3.5 mr-1" /> Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-2.5 font-semibold text-gray-500">Member</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-gray-500">Submitted</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-gray-500">Tasks</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-gray-500">Completed</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-gray-500">Present</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-gray-500">Remote</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-gray-500">Leave</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-gray-500">Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.members.map((m) => {
                      const subPct = Math.round((m.daysSubmitted / m.totalDays) * 100);
                      const compPct = m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0;
                      return (
                        <tr key={m.userId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                {m.name.split(" ").pop()?.charAt(0)}
                              </div>
                              <span className="font-semibold text-gray-900">{m.name}</span>
                            </div>
                          </td>
                          <td className="text-center px-3 py-3">
                            <span className={cn("font-semibold", subPct >= 80 ? "text-emerald-600" : subPct >= 50 ? "text-amber-600" : "text-red-500")}>
                              {m.daysSubmitted}/{m.totalDays}
                            </span>
                            <span className="text-gray-400 ml-1">({subPct}%)</span>
                          </td>
                          <td className="text-center px-3 py-3 font-medium text-gray-700">{m.totalTasks}</td>
                          <td className="text-center px-3 py-3">
                            <span className={cn("font-semibold", compPct >= 80 ? "text-emerald-600" : compPct >= 50 ? "text-amber-600" : "text-gray-500")}>
                              {m.completedTasks}
                            </span>
                            <span className="text-gray-400 ml-1">({compPct}%)</span>
                          </td>
                          <td className="text-center px-3 py-3 text-emerald-600 font-medium">{m.presentDays}</td>
                          <td className="text-center px-3 py-3 text-sky-600 font-medium">{m.remoteDays}</td>
                          <td className="text-center px-3 py-3 text-orange-600 font-medium">{m.leaveDays}</td>
                          <td className="text-center px-3 py-3 text-red-500 font-medium">{m.absentDays}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-gray-500" />
                Daily Submission Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {report.dailyBreakdown.map((d) => {
                  const pct = Math.round((d.submittedCount / d.totalMembers) * 100);
                  const dayLabel = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-500 w-28 flex-shrink-0 text-right">{dayLabel}</span>
                      <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : pct > 0 ? "bg-red-300" : "bg-gray-100")}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-600 w-16 flex-shrink-0">{d.submittedCount}/{d.totalMembers}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function OverviewCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  const colors: Record<string, { icon: string; bg: string }> = {
    indigo: { icon: "text-indigo-600", bg: "bg-indigo-50" },
    blue: { icon: "text-blue-600", bg: "bg-blue-50" },
    emerald: { icon: "text-emerald-600", bg: "bg-emerald-50" },
    violet: { icon: "text-violet-600", bg: "bg-violet-50" },
  };
  const c = colors[color] || colors.blue;

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
