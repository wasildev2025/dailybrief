"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAllAttendanceForDate,
  adminSaveAttendance,
} from "@/actions/attendance-actions";
import { formatDateISO } from "@/lib/date-utils";
import { toast } from "sonner";
import { Loader2, Save, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "PRESENT", label: "Present", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "REMOTE", label: "Remote", dot: "bg-sky-500", bg: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "HALF_DAY", label: "Half Day", dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "LEAVE", label: "Leave", dot: "bg-orange-500", bg: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "ABSENT", label: "Absent", dot: "bg-red-500", bg: "bg-red-50 text-red-700 border-red-200" },
] as const;

const REASON_REQUIRED = ["ABSENT", "LEAVE", "HALF_DAY"];

interface UserAttendance {
  user: { id: string; name: string; email: string; displayOrder: number };
  attendance: { id: string; status: string; reason: string | null } | null;
}

interface AdminAttendanceViewProps {
  selectedDate: Date;
}

export function AdminAttendanceView({ selectedDate }: AdminAttendanceViewProps) {
  const [data, setData] = useState<UserAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [editState, setEditState] = useState<Record<string, { status: string; reason: string }>>({});
  const [savingUser, setSavingUser] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllAttendanceForDate(formatDateISO(selectedDate));
      setData(result);
      const edits: Record<string, { status: string; reason: string }> = {};
      result.forEach((item) => {
        edits[item.user.id] = {
          status: item.attendance?.status || "",
          reason: item.attendance?.reason || "",
        };
      });
      setEditState(edits);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId: string, status: string) => {
    setEditState((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], status, reason: status === "PRESENT" ? "" : prev[userId]?.reason || "" },
    }));
  };

  const handleReasonChange = (userId: string, reason: string) => {
    setEditState((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], reason },
    }));
  };

  const handleSave = async (userId: string) => {
    const state = editState[userId];
    if (!state?.status) {
      toast.error("Select a status first");
      return;
    }
    if (REASON_REQUIRED.includes(state.status) && !state.reason.trim()) {
      toast.error("Reason is required for this status");
      return;
    }
    setSavingUser(userId);
    try {
      await adminSaveAttendance(userId, formatDateISO(selectedDate), state.status as any, state.reason);
      toast.success("Attendance saved");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSavingUser(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-gray-500" />
          Team Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {data.map(({ user }) => {
            const state = editState[user.id] || { status: "", reason: "" };
            const needsReason = REASON_REQUIRED.includes(state.status) || state.status === "REMOTE";
            const currentStatusConfig = STATUSES.find((s) => s.value === state.status);

            return (
              <div key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-600">
                      {user.name.split(" ").pop()?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  </div>
                  {currentStatusConfig && (
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", currentStatusConfig.bg)}>
                      {currentStatusConfig.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(user.id, s.value)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                        state.status === s.value
                          ? `${s.bg} border-current`
                          : "border-gray-150 text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {needsReason && (
                    <Input
                      value={state.reason}
                      onChange={(e) => handleReasonChange(user.id, e.target.value)}
                      placeholder="Reason..."
                      className="flex-1 h-8 text-xs"
                    />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSave(user.id)}
                    disabled={!state.status || savingUser === user.id}
                    className="h-8 text-xs"
                  >
                    {savingUser === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
