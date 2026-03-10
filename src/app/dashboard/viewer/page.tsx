import { getDashboardStats, getAllUpdatesForDate } from "@/actions/update-actions";
import { getAttendanceStats, getAllAttendanceForDate } from "@/actions/attendance-actions";
import { StatCard } from "@/components/shared/stat-card";
import {
  Users, CheckCircle, Clock, AlertCircle, FileText,
  UserCheck, UserX, MapPin, CalendarOff, ShieldCheck, Eye,
} from "lucide-react";
import { formatDateISO, formatDateForDisplay } from "@/lib/date-utils";
import { ViewerDateView } from "@/components/viewer/viewer-date-view";

export const dynamic = "force-dynamic";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function ViewerDashboard() {
  const today = formatDateISO(new Date());
  const [stats, attStats, updates, attendance] = await Promise.all([
    getDashboardStats(),
    getAttendanceStats(today),
    getAllUpdatesForDate(today),
    getAllAttendanceForDate(today),
  ]);

  const memberUpdates = updates.filter((u) => u.user.role === "MEMBER");

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
              <p className="text-white/70 text-sm mt-1">{formatDateForDisplay(new Date())} — Team overview (View Only)</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-[12px] font-medium rounded-lg px-3.5 py-2">
              <Eye className="h-3.5 w-3.5" /> Executive View
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-3xl font-bold">{stats.submittedToday + stats.reviewedToday + (stats.finalizedToday || 0)}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Work Updates</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Submitted" value={stats.submittedToday} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
              <StatCard title="Drafts" value={stats.draftToday} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
              <StatCard title="Reviewed" value={stats.reviewedToday} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
              <StatCard title="Finalized" value={stats.finalizedToday || 0} icon={ShieldCheck} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
              <StatCard title="Pending" value={stats.pendingToday} icon={AlertCircle} iconColor="text-red-500" iconBg="bg-red-50" />
            </div>
          </div>

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

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Team Status Today</p>
          <div className="space-y-2.5">
            {memberUpdates.map(({ user, update }) => {
              const att = attendance.find((a) => a.user.id === user.id);
              const attStatus = att?.attendance?.status;
              const taskCount = update?.tasks?.length || 0;

              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[12px] font-bold text-gray-600 flex-shrink-0">
                    {user.name.split(" ").pop()?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
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

      <ViewerDateView />
    </div>
  );
}
