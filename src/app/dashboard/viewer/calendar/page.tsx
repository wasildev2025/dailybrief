"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthlyCalendar } from "@/components/shared/monthly-calendar";
import { getTeamMonthlyCalendar, getTeamDayDetail, TeamCalendarDayData } from "@/actions/calendar-actions";
import { format, isToday } from "date-fns";
import { CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ATT_DISPLAY: Record<string, { dot: string; label: string; color: string }> = {
  PRESENT: { dot: "bg-emerald-500", label: "Present", color: "text-emerald-700" },
  ABSENT: { dot: "bg-red-500", label: "Absent", color: "text-red-700" },
  LEAVE: { dot: "bg-orange-500", label: "Leave", color: "text-orange-700" },
  HALF_DAY: { dot: "bg-amber-500", label: "Half Day", color: "text-amber-700" },
  REMOTE: { dot: "bg-sky-500", label: "Remote", color: "text-sky-700" },
};

interface DayDetail {
  id: string;
  name: string;
  attendance: { status: string; reason: string | null } | null;
  update: { status: string } | null;
  taskCount: number;
}

export default function ViewerCalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [data, setData] = useState<TeamCalendarDayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dayDetail, setDayDetail] = useState<DayDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTeamMonthlyCalendar(month.getFullYear(), month.getMonth());
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [month]);

  const fetchDayDetail = useCallback(async (date: Date) => {
    setDetailLoading(true);
    try {
      const result = await getTeamDayDetail(format(date, "yyyy-MM-dd"));
      setDayDetail(result);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);
  useEffect(() => { if (selectedDate) fetchDayDetail(selectedDate); }, [selectedDate, fetchDayDetail]);

  const calendarData = new Map<string, any>();
  for (const d of data) {
    calendarData.set(d.date, {
      teamPresent: d.presentCount,
      teamAbsent: d.absentCount,
      teamLeave: d.leaveCount,
      teamRemote: d.remoteCount,
      teamSubmitted: d.submittedCount,
      teamTotal: d.totalMembers,
    });
  }

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedDaySummary = selectedKey ? data.find((d) => d.date === selectedKey) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Team Calendar</h1>
          </div>
          <p className="text-[13px] text-gray-500">
            Monthly attendance overview and daily breakdowns (View Only)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3">
          <MonthlyCalendar
            data={calendarData}
            loading={loading}
            month={month}
            onMonthChange={setMonth}
            onDayClick={setSelectedDate}
            selectedDate={selectedDate}
            mode="team"
          />
        </div>

        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sticky top-6 overflow-hidden">
            {selectedDate ? (
              <>
                <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Date Detail</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">
                    {format(selectedDate, "EEE, MMM d")}
                  </p>
                  {isToday(selectedDate) && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                  {selectedDaySummary && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <MicroStat label="Present" value={selectedDaySummary.presentCount + selectedDaySummary.remoteCount} color="emerald" />
                      <MicroStat label="Absent" value={selectedDaySummary.absentCount} color="red" />
                      <MicroStat label="Leave" value={selectedDaySummary.leaveCount} color="orange" />
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 max-h-[480px] overflow-y-auto">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Team Members
                  </p>
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : dayDetail.length === 0 ? (
                    <p className="text-[12px] text-gray-400 italic py-4">No data</p>
                  ) : (
                    <div className="space-y-2">
                      {dayDetail.map((member) => {
                        const att = member.attendance;
                        const attConf = att ? ATT_DISPLAY[att.status] : null;
                        return (
                          <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                              {member.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-gray-800 truncate">{member.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {attConf ? (
                                  <span className="flex items-center gap-1">
                                    <span className={cn("h-1.5 w-1.5 rounded-full", attConf.dot)} />
                                    <span className={cn("text-[10px] font-medium", attConf.color)}>{attConf.label}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400">Not marked</span>
                                )}
                                {member.taskCount > 0 && (
                                  <span className="text-[10px] text-indigo-600 font-medium">
                                    · {member.taskCount} task{member.taskCount !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              {att?.reason && (
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{att.reason}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 px-5">
                <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-[12px] text-gray-400">Select a date to view team details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MicroStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn("text-center p-2 rounded-lg", `bg-${color}-50`)}>
      <p className={cn("text-base font-bold", `text-${color}-700`)}>{value}</p>
      <p className="text-[9px] text-gray-500 font-medium">{label}</p>
    </div>
  );
}
