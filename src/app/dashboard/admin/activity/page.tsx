"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRecentActivity, ActivityItem } from "@/actions/activity-actions";
import { toast } from "sonner";
import {
  Loader2, Activity, Clock, User, FileText, CalendarDays,
  Lock, Unlock, CheckCircle, Send, ShieldCheck, PenLine, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const actionIcons: Record<string, any> = {
  submitted: Send,
  saved_draft: FileText,
  reviewed: CheckCircle,
  finalized: ShieldCheck,
  admin_saved: PenLine,
  admin_created_update: PenLine,
  locked_date: Lock,
  unlocked_date: Unlock,
  bulk_attendance: CalendarDays,
};

const actionColors: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-600",
  saved_draft: "bg-amber-50 text-amber-600",
  reviewed: "bg-emerald-50 text-emerald-600",
  finalized: "bg-indigo-50 text-indigo-600",
  admin_saved: "bg-violet-50 text-violet-600",
  admin_created_update: "bg-violet-50 text-violet-600",
  locked_date: "bg-red-50 text-red-600",
  unlocked_date: "bg-gray-50 text-gray-600",
  bulk_attendance: "bg-sky-50 text-sky-600",
};

const actionLabels: Record<string, string> = {
  submitted: "Submitted Update",
  saved_draft: "Saved Draft",
  reviewed: "Marked Reviewed",
  finalized: "Finalized Update",
  admin_saved: "Admin Edited",
  admin_created_update: "Admin Created",
  locked_date: "Locked Date",
  unlocked_date: "Unlocked Date",
  bulk_attendance: "Saved Attendance",
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  useEffect(() => { loadActivity(); }, [limit]);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const data = await getRecentActivity(limit);
      setActivities(data);
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (items: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};
    items.forEach((item) => {
      const day = new Date(item.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    });
    return groups;
  };

  const grouped = groupByDate(activities);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Activity Log
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Audit trail of all team actions and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">{activities.length} entries</span>
          {activities.length >= limit && (
            <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + 50)} className="text-[11px] h-7">
              Load More
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl animate-pulse">
              <div className="h-9 w-9 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-50 rounded" />
              </div>
              <div className="h-3 w-20 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No activity recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">Actions will appear here as team members use the system</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{date}</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="space-y-1.5">
                {items.map((item) => {
                  const Icon = actionIcons[item.action] || Activity;
                  const colorClass = actionColors[item.action] || "bg-gray-50 text-gray-600";
                  const label = actionLabels[item.action] || item.action;

                  return (
                    <div key={item.id} className="flex items-start gap-3.5 px-4 py-3 bg-white rounded-xl border border-gray-50 hover:border-gray-100 transition-colors">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-gray-900">{item.user.name}</span>
                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", colorClass)}>
                            {label}
                          </span>
                          {item.user.role === "ADMIN" && (
                            <span className="text-[9px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">ADMIN</span>
                          )}
                        </div>
                        {item.details && (
                          <p className="text-[12px] text-gray-500 mt-0.5 truncate">{item.details}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
