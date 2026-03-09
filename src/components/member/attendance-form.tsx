"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAttendanceForDate,
  saveAttendance,
} from "@/actions/attendance-actions";
import { isDateLocked } from "@/actions/update-actions";
import { formatDateISO } from "@/lib/date-utils";
import { toast } from "sonner";
import { Loader2, Check, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "PRESENT", label: "Present", color: "bg-emerald-500", ring: "ring-emerald-500/30" },
  { value: "REMOTE", label: "Remote", color: "bg-sky-500", ring: "ring-sky-500/30" },
  { value: "HALF_DAY", label: "Half Day", color: "bg-amber-500", ring: "ring-amber-500/30" },
  { value: "LEAVE", label: "Leave", color: "bg-orange-500", ring: "ring-orange-500/30" },
  { value: "ABSENT", label: "Absent", color: "bg-red-500", ring: "ring-red-500/30" },
] as const;

const REASON_REQUIRED = ["ABSENT", "LEAVE", "HALF_DAY"];

interface AttendanceFormProps {
  selectedDate: Date;
}

export function AttendanceForm({ selectedDate }: AttendanceFormProps) {
  const [status, setStatus] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const dateStr = formatDateISO(selectedDate);
      const [att, isLck] = await Promise.all([
        getAttendanceForDate(dateStr),
        isDateLocked(dateStr),
      ]);
      setLocked(isLck);
      if (att) {
        setStatus(att.status);
        setReason(att.reason || "");
        setSaved(true);
      } else {
        setStatus("");
        setReason("");
      }
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!status) {
      toast.error("Please select your attendance status");
      return;
    }
    if (REASON_REQUIRED.includes(status) && !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setSaving(true);
    try {
      await saveAttendance(formatDateISO(selectedDate), status as any, reason);
      setSaved(true);
      toast.success("Attendance marked");
    } catch (error: any) {
      toast.error(error.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const needsReason = REASON_REQUIRED.includes(status) || status === "REMOTE";

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-gray-500" />
            Attendance
          </CardTitle>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" /> Marked
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {STATUSES.map((s) => {
            const selected = status === s.value;
            return (
              <button
                key={s.value}
                onClick={() => !locked && setStatus(s.value)}
                disabled={locked}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-1 text-xs font-medium transition-all",
                  selected
                    ? `border-transparent ring-2 ${s.ring} bg-gray-50`
                    : "border-gray-100 hover:border-gray-200 bg-white",
                  locked && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
                <span className="text-gray-700">{s.label}</span>
                {selected && (
                  <Check className="absolute top-1.5 right-1.5 h-3 w-3 text-gray-500" />
                )}
              </button>
            );
          })}
        </div>

        {needsReason && (
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">
              Reason {REASON_REQUIRED.includes(status) ? "(required)" : "(optional)"}
            </Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sick leave, Personal work..."
              disabled={locked}
              className="text-sm"
            />
          </div>
        )}

        {!locked && (
          <Button onClick={handleSave} disabled={saving || !status} className="w-full" size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            {saved ? "Update Attendance" : "Mark Attendance"}
          </Button>
        )}

        {locked && (
          <p className="text-xs text-center text-red-500 font-medium">
            This date is locked by admin
          </p>
        )}
      </CardContent>
    </Card>
  );
}
