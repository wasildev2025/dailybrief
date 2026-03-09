import { getDashboardStats } from "@/actions/update-actions";
import { StatCard } from "@/components/shared/stat-card";
import { Users, CheckCircle, Clock, AlertCircle, FileText } from "lucide-react";
import { AdminDateView } from "@/components/admin/admin-date-view";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Today&apos;s overview and team activity
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Team"
          value={stats.totalMembers}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Submitted"
          value={stats.submittedToday}
          icon={FileText}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Drafts"
          value={stats.draftToday}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Reviewed"
          value={stats.reviewedToday}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Pending"
          value={stats.pendingToday}
          icon={AlertCircle}
          iconColor="text-red-500"
          iconBg="bg-red-50"
        />
      </div>

      <AdminDateView />
    </div>
  );
}
