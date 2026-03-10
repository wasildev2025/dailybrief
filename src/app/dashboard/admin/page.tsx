import { getDashboardStats, getAllUpdatesForDate } from "@/actions/update-actions";
import { getAttendanceStats, getAllAttendanceForDate } from "@/actions/attendance-actions";
import { StatCard } from "@/components/shared/stat-card";
import {
  Users, CheckCircle, Clock, AlertCircle, FileText,
  UserCheck, UserX, MapPin, CalendarOff,
  ArrowRight, Sparkles, CalendarDays, BarChart3,
} from "lucide-react";
import { AdminDateView } from "@/components/admin/admin-date-view";
import { SendRemindersButton } from "@/components/admin/send-reminders-button";
import { formatDateISO, formatDateForDisplay } from "@/lib/date-utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboard() {
  const today = formatDateISO(new Date());
  const [stats, attStats, updates, attendance] = await Promise.all([
    getDashboardStats(),
    getAttendanceStats(today),
    getAllUpdatesForDate(today),
    getAllAttendanceForDate(today),
  ]);

  const memberUpdates = updates.filter((u) => u.user.role === "MEMBER");
  const submittedMembers = memberUpdates.filter((u) => u.update?.status === "SUBMITTED" || u.update?.status === "REVIEWED");
  const pendingMembers = memberUpdates.filter((u) => !u.update || u.update.status === "DRAFT");

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, Admin</h1>
              <p className="text-white/70 text-sm mt-1">{formatDateForDisplay(new Date())} — Here&apos;s your team&apos;s status today</p>
            </div>
            <div className="flex gap-2">
              <SendRemindersButton />
              <Link
                href="/dashboard/admin/reports"
                className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors text-white text-[12px] font-medium rounded-lg px-3.5 py-2"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate Brief
              </Link>
            </div>
          </div>

          {/* Quick Stats in header */}
          <div className="grid grid-cols-4 gap-4 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-3xl font-bold">{stats.submittedToday + stats.reviewedToday}</p>
              <p className="text-[11px] text-white/60">Submitted</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-3xl font-bold">{stats.pendingToday}</p>
              <p className="text-[11px] text-white/60">Pending</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-3xl font-bold">{attStats.present + attStats.remote}</p>
              <p className="text-[11px] text-white/60">Available</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-3xl font-bold">{stats.totalMembers}</p>
              <p className="text-[11px] text-white/60">Team Size</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/admin/reports" className="group flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all hover:border-indigo-100">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900">Generate Brief</p>
            <p className="text-[11px] text-gray-400">Create today&apos;s report</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
        </Link>
        <Link href="/dashboard/admin/calendar" className="group flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all hover:border-blue-100">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900">Calendar</p>
            <p className="text-[11px] text-gray-400">Monthly overview</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </Link>
        <Link href="/dashboard/admin/kpi" className="group flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all hover:border-violet-100">
          <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
            <BarChart3 className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900">KPI Insights</p>
            <p className="text-[11px] text-gray-400">AI-powered analytics</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
        </Link>
        <Link href="/dashboard/admin/users" className="group flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all hover:border-emerald-100">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900">Manage Team</p>
            <p className="text-[11px] text-gray-400">Add/edit members</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Stats Column */}
        <div className="space-y-5">
          {/* Work Update Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Work Updates</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Submitted" value={stats.submittedToday} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
              <StatCard title="Drafts" value={stats.draftToday} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
              <StatCard title="Reviewed" value={stats.reviewedToday} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
              <StatCard title="Pending" value={stats.pendingToday} icon={AlertCircle} iconColor="text-red-500" iconBg="bg-red-50" />
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Attendance</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Present" value={attStats.present} icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
              <StatCard title="Remote" value={attStats.remote} icon={MapPin} iconColor="text-sky-600" iconBg="bg-sky-50" />
              <StatCard title="Leave" value={attStats.leave} icon={CalendarOff} iconColor="text-orange-600" iconBg="bg-orange-50" />
              <StatCard title="Absent" value={attStats.absent} icon={UserX} iconColor="text-red-500" iconBg="bg-red-50" />
            </div>
          </div>
        </div>

        {/* Team Status Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Team Status Today</p>
          <div className="space-y-2.5">
            {memberUpdates.map(({ user, update }) => {
              const att = attendance.find((a) => a.user.id === user.id);
              const attStatus = att?.attendance?.status;
              const taskCount = update?.tasks?.length || 0;

              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[12px] font-bold text-gray-600 flex-shrink-0">
                    {user.name.split(" ").pop()?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Attendance pill */}
                      {attStatus ? (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          attStatus === "PRESENT" ? "bg-emerald-50 text-emerald-700" :
                          attStatus === "REMOTE" ? "bg-sky-50 text-sky-700" :
                          attStatus === "LEAVE" ? "bg-orange-50 text-orange-700" :
                          attStatus === "ABSENT" ? "bg-red-50 text-red-600" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {attStatus.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Unmarked</span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {taskCount > 0 ? `${taskCount} task${taskCount !== 1 ? "s" : ""}` : "No tasks"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {update ? (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        update.status === "FINALIZED" ? "bg-indigo-50 text-indigo-700" :
                        update.status === "REVIEWED" ? "bg-emerald-50 text-emerald-700" :
                        update.status === "SUBMITTED" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {update.status}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">PENDING</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Task Management */}
      <AdminDateView />
    </div>
  );
}
