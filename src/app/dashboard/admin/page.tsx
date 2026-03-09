import { getDashboardStats } from "@/actions/update-actions";
import { getAttendanceStats } from "@/actions/attendance-actions";
import { StatCard } from "@/components/shared/stat-card";
import { Users, CheckCircle, Clock, AlertCircle, FileText, UserCheck, UserX, MapPin, CalendarOff } from "lucide-react";
import { AdminDateView } from "@/components/admin/admin-date-view";
import { formatDateISO } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const today = formatDateISO(new Date());
  const [stats, attStats] = await Promise.all([
    getDashboardStats(),
    getAttendanceStats(today),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Today&apos;s overview and team activity
        </p>
      </div>

      {/* Work Update Stats */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Work Updates</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard title="Team" value={stats.totalMembers} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
          <StatCard title="Submitted" value={stats.submittedToday} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard title="Drafts" value={stats.draftToday} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
          <StatCard title="Reviewed" value={stats.reviewedToday} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <StatCard title="Pending" value={stats.pendingToday} icon={AlertCircle} iconColor="text-red-500" iconBg="bg-red-50" />
        </div>
      </div>

      {/* Attendance Stats */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Attendance</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard title="Present" value={attStats.present} icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <StatCard title="Remote" value={attStats.remote} icon={MapPin} iconColor="text-sky-600" iconBg="bg-sky-50" />
          <StatCard title="Leave" value={attStats.leave} icon={CalendarOff} iconColor="text-orange-600" iconBg="bg-orange-50" />
          <StatCard title="Absent" value={attStats.absent} icon={UserX} iconColor="text-red-500" iconBg="bg-red-50" />
          <StatCard title="Unmarked" value={attStats.unmarked} icon={AlertCircle} iconColor="text-gray-400" iconBg="bg-gray-50" />
        </div>
      </div>

      <AdminDateView />
    </div>
  );
}
