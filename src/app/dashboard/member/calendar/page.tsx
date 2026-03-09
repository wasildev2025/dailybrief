"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthlyCalendar } from "@/components/shared/monthly-calendar";
import { getMyMonthlyCalendar, CalendarDayData } from "@/actions/calendar-actions";
import { format, isToday } from "date-fns";
import { CalendarDays, CheckCircle2, Clock, TrendingUp, MapPin, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ATT_DISPLAY: Record<string, { icon: string; color: string; label: string }> = {
  PRESENT: { icon: "bg-emerald-500", color: "text-emerald-700", label: "Present" },
  ABSENT: { icon: "bg-red-500", color: "text-red-700", label: "Absent" },
  LEAVE: { icon: "bg-orange-500", color: "text-orange-700", label: "Leave" },
  HALF_DAY: { icon: "bg-amber-500", color: "text-amber-700", label: "Half Day" },
  REMOTE: { icon: "bg-sky-500", color: "text-sky-700", label: "Remote" },
};

export default function MemberCalendarPage() {
  const router = useRouter();
  const [month, setMonth] = useState(new Date());
  const [data, setData] = useState<CalendarDayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyMonthlyCalendar(month.getFullYear(), month.getMonth());
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calendarData = new Map<string, any>();
  for (const d of data) {
    calendarData.set(d.date, { attendance: d.attendance, update: d.update });
  }

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedDay = selectedKey ? data.find((d) => d.date === selectedKey) : null;

  // Stats for the current month
  const totalWorkDays = data.filter((d) => {
    const day = new Date(d.date).getDay();
    return day !== 0 && new Date(d.date) <= new Date();
  }).length;
  const presentDays = data.filter((d) => d.attendance?.status === "PRESENT" || d.attendance?.status === "REMOTE").length;
  const submittedDays = data.filter((d) => d.update && d.update.status !== "DRAFT").length;
  const leaveDays = data.filter((d) => d.attendance?.status === "LEAVE" || d.attendance?.status === "ABSENT").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Calendar</h1>
          </div>
          <p className="text-[13px] text-gray-500">
            Track your attendance, work submissions, and monthly performance at a glance.
          </p>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Present Days" value={presentDays} subtext={`of ${totalWorkDays} work days`} color="emerald" />
        <MiniStat icon={<TrendingUp className="h-4 w-4 text-indigo-600" />} label="Tasks Logged" value={submittedDays} subtext="days submitted" color="indigo" />
        <MiniStat icon={<AlertTriangle className="h-4 w-4 text-orange-600" />} label="Leave / Absent" value={leaveDays} subtext="days off" color="orange" />
        <MiniStat icon={<MapPin className="h-4 w-4 text-sky-600" />} label="Attendance Rate" value={totalWorkDays > 0 ? `${Math.round((presentDays / totalWorkDays) * 100)}%` : "—"} subtext={format(month, "MMMM")} color="sky" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Calendar */}
        <div className="xl:col-span-3">
          <MonthlyCalendar
            data={calendarData}
            loading={loading}
            month={month}
            onMonthChange={setMonth}
            onDayClick={setSelectedDate}
            selectedDate={selectedDate}
            mode="personal"
          />
        </div>

        {/* Day Detail Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sticky top-6">
            {selectedDate ? (
              <>
                <div className="mb-4">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Selected Date</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">
                    {format(selectedDate, "EEE, MMM d")}
                  </p>
                  {isToday(selectedDate) && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>

                {/* Attendance */}
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Attendance</p>
                  {selectedDay?.attendance ? (
                    <div className={cn("flex items-center gap-2 p-3 rounded-xl", `${ATT_DISPLAY[selectedDay.attendance.status]?.icon}/10`)}>
                      <span className={cn("h-2.5 w-2.5 rounded-full", ATT_DISPLAY[selectedDay.attendance.status]?.icon)} />
                      <div>
                        <p className={cn("text-[13px] font-semibold", ATT_DISPLAY[selectedDay.attendance.status]?.color)}>
                          {ATT_DISPLAY[selectedDay.attendance.status]?.label}
                        </p>
                        {selectedDay.attendance.reason && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{selectedDay.attendance.reason}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-gray-400 italic">Not marked</p>
                  )}
                </div>

                {/* Tasks */}
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Work Update</p>
                  {selectedDay?.update ? (
                    <div className="p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          selectedDay.update.status === "REVIEWED" ? "bg-emerald-100 text-emerald-700" :
                          selectedDay.update.status === "SUBMITTED" ? "bg-indigo-100 text-indigo-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {selectedDay.update.status}
                        </span>
                        <span className="text-[12px] text-gray-600 font-semibold">
                          {selectedDay.update.taskCount} task{selectedDay.update.taskCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-gray-400 italic">No update</p>
                  )}
                </div>

                <button
                  onClick={() => router.push("/dashboard/member")}
                  className="w-full text-center text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl py-2.5 transition-colors"
                >
                  Go to Daily Updates →
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-[12px] text-gray-400">Select a date to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, subtext, color }: {
  icon: React.ReactNode; label: string; value: number | string; subtext: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", `bg-${color}-50`)}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{subtext}</p>
    </div>
  );
}
