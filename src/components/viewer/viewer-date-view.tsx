"use client";

import { useState, useEffect } from "react";
import { getAllUpdatesForDate } from "@/actions/update-actions";
import { getAllAttendanceForDate } from "@/actions/attendance-actions";
import { formatDateISO } from "@/lib/date-utils";
import { Calendar, Loader2, ChevronDown, ChevronRight } from "lucide-react";

interface SubTask {
  id: string;
  text: string;
  sortOrder: number;
}

interface Task {
  id: string;
  text: string;
  sortOrder: number;
  taskStatus?: { label: string; color: string } | null;
  subTasks: SubTask[];
}

interface UserUpdate {
  user: { id: string; name: string; email: string; role: string; displayOrder: number };
  update: {
    id: string;
    status: string;
    tasks: Task[];
  } | null;
}

interface AttendanceEntry {
  user: { id: string; name: string; email: string; displayOrder: number };
  attendance: { status: string; reason: string | null } | null;
}

export function ViewerDateView() {
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [tab, setTab] = useState<"tasks" | "attendance">("tasks");
  const [updates, setUpdates] = useState<UserUpdate[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, a] = await Promise.all([
        getAllUpdatesForDate(date),
        getAllAttendanceForDate(date),
      ]);
      setUpdates(u as any);
      setAttendance(a as any);
    } catch {
      // Silently fail for viewer
    } finally {
      setLoading(false);
    }
  };

  const memberUpdates = updates.filter((u) => u.user.role === "MEMBER");

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 px-3 py-1.5">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-[13px] font-medium text-gray-700 outline-none"
            />
          </div>
          <span className="text-[13px] text-gray-500">
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setTab("tasks")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors ${
            tab === "tasks" ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Task Updates
        </button>
        <button
          onClick={() => setTab("attendance")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors ${
            tab === "attendance" ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Attendance
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : tab === "tasks" ? (
          <div className="space-y-4">
            {memberUpdates.map(({ user, update }) => (
              <div key={user.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600">
                      {user.name.split(" ").pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{user.name}</p>
                      <p className="text-[10px] text-gray-400">{user.email}</p>
                    </div>
                  </div>
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
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">NO TASKS</span>
                  )}
                </div>

                {update && update.tasks.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    {update.tasks.map((task, idx) => (
                      <div key={task.id} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-[11px] text-gray-400 mt-0.5 w-4 flex-shrink-0">{idx + 1}.</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] text-gray-700" dangerouslySetInnerHTML={{ __html: task.text }} />
                              {task.taskStatus && (
                                <span
                                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: task.taskStatus.color }}
                                >
                                  {task.taskStatus.label}
                                </span>
                              )}
                            </div>
                            {task.subTasks.length > 0 && (
                              <div className="mt-1">
                                <button
                                  onClick={() => setExpanded((p) => ({ ...p, [task.id]: !p[task.id] }))}
                                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
                                >
                                  {expanded[task.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  {task.subTasks.length} sub-task{task.subTasks.length !== 1 ? "s" : ""}
                                </button>
                                {expanded[task.id] && (
                                  <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                                    {task.subTasks.map((st, si) => (
                                      <p key={st.id} className="text-[12px] text-gray-500">
                                        {idx + 1}.{si + 1}. {st.text}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(!update || update.tasks.length === 0) && (
                  <div className="px-4 py-4 text-center">
                    <p className="text-[12px] text-gray-400 italic">No tasks submitted</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {attendance.map(({ user, attendance: att }) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600 flex-shrink-0">
                  {user.name.split(" ").pop()?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900">{user.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {att ? (
                    <>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        att.status === "PRESENT" ? "bg-emerald-50 text-emerald-700" :
                        att.status === "REMOTE" ? "bg-sky-50 text-sky-700" :
                        att.status === "LEAVE" ? "bg-orange-50 text-orange-700" :
                        att.status === "ABSENT" ? "bg-red-50 text-red-600" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {att.status.replace("_", " ")}
                      </span>
                      {att.reason && (
                        <span className="text-[10px] text-gray-400 italic">— {att.reason}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Unmarked</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
