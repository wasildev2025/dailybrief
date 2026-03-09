"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from "date-fns";

interface CalendarCellData {
  attendance?: { status: string; reason?: string | null } | null;
  update?: { status: string; taskCount?: number } | null;
  teamPresent?: number;
  teamAbsent?: number;
  teamLeave?: number;
  teamRemote?: number;
  teamSubmitted?: number;
  teamTotal?: number;
}

interface MonthlyCalendarProps {
  data: Map<string, CalendarCellData>;
  loading: boolean;
  month: Date;
  onMonthChange: (date: Date) => void;
  onDayClick?: (date: Date) => void;
  selectedDate?: Date | null;
  mode: "personal" | "team";
}

const ATT_COLORS: Record<string, { dot: string; bg: string; label: string }> = {
  PRESENT: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", label: "Present" },
  ABSENT: { dot: "bg-red-500", bg: "bg-red-500/10", label: "Absent" },
  LEAVE: { dot: "bg-orange-500", bg: "bg-orange-500/10", label: "Leave" },
  HALF_DAY: { dot: "bg-amber-500", bg: "bg-amber-500/10", label: "Half Day" },
  REMOTE: { dot: "bg-sky-500", bg: "bg-sky-500/10", label: "Remote" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyCalendar({
  data,
  loading,
  month,
  onMonthChange,
  onDayClick,
  selectedDate,
  mode,
}: MonthlyCalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const weeks: Date[][] = [];
  let current = calStart;
  while (current <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current = addDays(current, 1);
    }
    weeks.push(week);
  }

  const goToPrev = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const goToNext = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const goToToday = () => onMonthChange(new Date());

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {format(month, "MMMM yyyy")}
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {mode === "personal" ? "Your attendance & work log" : "Team overview"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToToday} className="text-[11px] h-7 mr-1">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToPrev} className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNext} className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="p-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden">
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const key = format(day, "yyyy-MM-dd");
                const cell = data.get(key);
                const inMonth = isSameMonth(day, month);
                const today = isToday(day);
                const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isSunday = day.getDay() === 0;

                return (
                  <button
                    key={key}
                    onClick={() => onDayClick?.(day)}
                    disabled={!inMonth}
                    className={cn(
                      "relative flex flex-col items-start p-2 min-h-[84px] bg-white transition-all text-left",
                      !inMonth && "bg-gray-50/60 opacity-40",
                      inMonth && "hover:bg-indigo-50/40",
                      selected && "ring-2 ring-indigo-500 ring-inset bg-indigo-50/30",
                      today && !selected && "bg-blue-50/30",
                    )}
                  >
                    {/* Day number */}
                    <span
                      className={cn(
                        "text-[12px] font-semibold leading-none mb-1.5",
                        !inMonth && "text-gray-300",
                        inMonth && "text-gray-700",
                        today && "text-indigo-700",
                        isSunday && inMonth && "text-red-500",
                      )}
                    >
                      {format(day, "d")}
                      {today && (
                        <span className="ml-1 inline-block h-1 w-1 rounded-full bg-indigo-500 align-middle" />
                      )}
                    </span>

                    {/* Cell content */}
                    {inMonth && cell && mode === "personal" && (
                      <PersonalCell cell={cell} />
                    )}
                    {inMonth && cell && mode === "team" && (
                      <TeamCell cell={cell} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(ATT_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", val.dot)} />
            <span className="text-[10px] text-gray-500">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-indigo-500" />
          <span className="text-[10px] text-gray-500">Tasks Submitted</span>
        </div>
      </div>
    </div>
  );
}

function PersonalCell({ cell }: { cell: CalendarCellData }) {
  const att = cell.attendance;
  const upd = cell.update;
  const attConf = att ? ATT_COLORS[att.status] : null;

  return (
    <div className="flex flex-col gap-0.5 w-full">
      {attConf && (
        <span className={cn("inline-flex items-center gap-1 text-[9px] font-medium px-1 py-0.5 rounded", attConf.bg)}>
          <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", attConf.dot)} />
          <span className="truncate">{attConf.label}</span>
        </span>
      )}
      {upd && (
        <span className={cn(
          "text-[9px] font-medium px-1 py-0.5 rounded",
          upd.status === "REVIEWED" ? "bg-emerald-50 text-emerald-700" :
          upd.status === "SUBMITTED" ? "bg-indigo-50 text-indigo-700" :
          "bg-amber-50 text-amber-700"
        )}>
          {upd.taskCount || 0} task{(upd.taskCount || 0) !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

function TeamCell({ cell }: { cell: CalendarCellData }) {
  const total = cell.teamTotal || 0;
  if (total === 0) return null;

  const present = (cell.teamPresent || 0) + (cell.teamRemote || 0);
  const absent = (cell.teamAbsent || 0) + (cell.teamLeave || 0);
  const submitted = cell.teamSubmitted || 0;

  const presentPct = Math.round((present / total) * 100);

  return (
    <div className="flex flex-col gap-0.5 w-full">
      {/* Mini attendance bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
        {cell.teamPresent! > 0 && (
          <div className="bg-emerald-500 h-full" style={{ width: `${(cell.teamPresent! / total) * 100}%` }} />
        )}
        {cell.teamRemote! > 0 && (
          <div className="bg-sky-500 h-full" style={{ width: `${(cell.teamRemote! / total) * 100}%` }} />
        )}
        {cell.teamLeave! > 0 && (
          <div className="bg-orange-500 h-full" style={{ width: `${(cell.teamLeave! / total) * 100}%` }} />
        )}
        {cell.teamAbsent! > 0 && (
          <div className="bg-red-500 h-full" style={{ width: `${(cell.teamAbsent! / total) * 100}%` }} />
        )}
      </div>
      <span className="text-[9px] text-gray-500 font-medium">
        {presentPct}% in
      </span>
      {submitted > 0 && (
        <span className="text-[9px] text-indigo-600 font-medium">
          {submitted}/{total} logs
        </span>
      )}
    </div>
  );
}
