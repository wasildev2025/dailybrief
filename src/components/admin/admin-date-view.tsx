"use client";

import { useState, useEffect } from "react";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminAttendanceView } from "@/components/admin/admin-attendance-view";
import {
  getAllUpdatesForDate,
  adminSaveUpdate,
  addAdminNote,
  lockDate,
  unlockDate,
  isDateLocked,
} from "@/actions/update-actions";
import { formatDateISO, formatDateForDisplay } from "@/lib/date-utils";
import { toast } from "sonner";
import {
  ClipboardList,
  Save,
  Lock,
  Unlock,
  MessageSquare,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  ListChecks,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskInput } from "@/actions/update-actions";

interface UserUpdate {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    displayOrder: number;
  };
  update: {
    id: string;
    status: string;
    tasks: { id: string; text: string; sortOrder: number; subTasks: { id: string; text: string; sortOrder: number }[] }[];
    adminNotes: { id: string; note: string; createdBy: { name: string }; createdAt: Date }[];
  } | null;
}

interface EditableTask {
  text: string;
  subTasks: string[];
  expanded: boolean;
}

export function AdminDateView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [userUpdates, setUserUpdates] = useState<UserUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [editedTasks, setEditedTasks] = useState<Record<string, EditableTask[]>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"tasks" | "attendance">("tasks");

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dateStr = formatDateISO(selectedDate);
      const [data, isLck] = await Promise.all([
        getAllUpdatesForDate(dateStr),
        isDateLocked(dateStr),
      ]);
      setUserUpdates(data);
      setLocked(isLck);

      const edits: Record<string, EditableTask[]> = {};
      data.forEach((item: UserUpdate) => {
        if (item.update) {
          edits[item.update.id] = item.update.tasks.map((t) => ({
            text: t.text,
            subTasks: t.subTasks.map((s) => s.text),
            expanded: t.subTasks.length > 0,
          }));
        }
      });
      setEditedTasks(edits);
    } catch {
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTasks = async (updateId: string, status?: "DRAFT" | "SUBMITTED" | "REVIEWED") => {
    try {
      const payload: TaskInput[] = (editedTasks[updateId] || []).map((t) => ({
        text: t.text,
        subTasks: t.subTasks,
      }));
      await adminSaveUpdate(updateId, payload, status);
      toast.success(status === "REVIEWED" ? "Marked as reviewed" : "Update saved");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    }
  };

  const handleAddNote = async (updateId: string) => {
    const note = noteInputs[updateId]?.trim();
    if (!note) return;
    try {
      await addAdminNote(updateId, note);
      setNoteInputs((prev) => ({ ...prev, [updateId]: "" }));
      toast.success("Note added");
      loadData();
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleToggleLock = async () => {
    try {
      if (locked) {
        await unlockDate(formatDateISO(selectedDate));
        setLocked(false);
        toast.success("Date unlocked");
      } else {
        await lockDate(formatDateISO(selectedDate));
        setLocked(true);
        toast.success("Date locked");
      }
    } catch {
      toast.error("Failed to toggle lock");
    }
  };

  const updateTaskText = (updateId: string, index: number, value: string) => {
    setEditedTasks((prev) => {
      const tasks = [...(prev[updateId] || [])];
      tasks[index] = { ...tasks[index], text: value };
      return { ...prev, [updateId]: tasks };
    });
  };

  const addTaskField = (updateId: string) => {
    setEditedTasks((prev) => ({
      ...prev,
      [updateId]: [...(prev[updateId] || []), { text: "", subTasks: [], expanded: false }],
    }));
  };

  const removeTaskField = (updateId: string, index: number) => {
    setEditedTasks((prev) => {
      const tasks = [...(prev[updateId] || [])];
      tasks.splice(index, 1);
      return { ...prev, [updateId]: tasks.length ? tasks : [{ text: "", subTasks: [], expanded: false }] };
    });
  };

  const toggleTaskExpanded = (updateId: string, index: number) => {
    setEditedTasks((prev) => {
      const tasks = [...(prev[updateId] || [])];
      const task = tasks[index];
      if (!task.expanded && task.subTasks.length === 0) {
        tasks[index] = { ...task, expanded: true, subTasks: [""] };
      } else {
        tasks[index] = { ...task, expanded: !task.expanded };
      }
      return { ...prev, [updateId]: tasks };
    });
  };

  const addSubTaskField = (updateId: string, taskIndex: number) => {
    setEditedTasks((prev) => {
      const tasks = [...(prev[updateId] || [])];
      tasks[taskIndex] = { ...tasks[taskIndex], subTasks: [...tasks[taskIndex].subTasks, ""], expanded: true };
      return { ...prev, [updateId]: tasks };
    });
  };

  const removeSubTaskField = (updateId: string, taskIndex: number, subIndex: number) => {
    setEditedTasks((prev) => {
      const tasks = [...(prev[updateId] || [])];
      const subs = tasks[taskIndex].subTasks.filter((_, i) => i !== subIndex);
      tasks[taskIndex] = { ...tasks[taskIndex], subTasks: subs, expanded: subs.length > 0 };
      return { ...prev, [updateId]: tasks };
    });
  };

  const updateSubTaskText = (updateId: string, taskIndex: number, subIndex: number, value: string) => {
    setEditedTasks((prev) => {
      const tasks = [...(prev[updateId] || [])];
      const subs = [...tasks[taskIndex].subTasks];
      subs[subIndex] = value;
      tasks[taskIndex] = { ...tasks[taskIndex], subTasks: subs };
      return { ...prev, [updateId]: tasks };
    });
  };

  const memberUpdates = userUpdates.filter((u) => u.user.role === "MEMBER");

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <DatePickerField
            date={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
          />
          <span className="text-sm font-medium text-gray-600">
            {formatDateForDisplay(selectedDate)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {locked && (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-100">
                Date Locked
              </span>
            )}
            <Button
              variant={locked ? "destructive" : "outline"}
              onClick={handleToggleLock}
              size="sm"
              className="text-xs"
            >
              {locked ? (
                <><Unlock className="h-3.5 w-3.5 mr-1" /> Unlock</>
              ) : (
                <><Lock className="h-3.5 w-3.5 mr-1" /> Lock Date</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
            activeTab === "tasks"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <ListChecks className="h-3.5 w-3.5 inline mr-1.5" />
          Task Updates
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={cn(
            "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
            activeTab === "attendance"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <CheckCircle className="h-3.5 w-3.5 inline mr-1.5" />
          Attendance
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : memberUpdates.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No team members"
              description="Add team members from the Users page"
            />
          ) : (
            <div className="space-y-3">
              {memberUpdates.map(({ user, update }) => (
                <Card key={user.id} className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600">
                          {user.name.split(" ").pop()?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{user.name}</p>
                          <p className="text-[11px] text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <StatusBadge status={update ? (update.status as any) : "NOT_SUBMITTED"} />
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-4 space-y-2.5">
                    {update ? (
                      <>
                        {(editedTasks[update.id] || []).map((task, idx) => (
                          <div key={idx} className="group/atask">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-400 w-5 text-right flex-shrink-0 font-mono">
                                {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleTaskExpanded(update.id, idx)}
                                className={cn(
                                  "h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex-shrink-0",
                                  task.expanded && "text-indigo-600 bg-indigo-50"
                                )}
                              >
                                {task.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              </button>
                              <Input
                                value={task.text}
                                onChange={(e) => updateTaskText(update.id, idx, e.target.value)}
                                className="flex-1 h-8 text-sm bg-gray-50/60 border-gray-200"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTaskField(update.id, idx)}
                                className="h-7 w-7 text-gray-300 hover:text-red-500 opacity-0 group-hover/atask:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {task.expanded && (
                              <div className="ml-[44px] mt-1 mb-1.5 pl-2.5 border-l-2 border-indigo-100 space-y-1">
                                {task.subTasks.map((sub, si) => (
                                  <div key={si} className="flex items-center gap-1.5 group/asub">
                                    <CornerDownRight className="h-2.5 w-2.5 text-gray-300 flex-shrink-0" />
                                    <Input
                                      value={sub}
                                      onChange={(e) => updateSubTaskText(update.id, idx, si, e.target.value)}
                                      className="flex-1 h-6 text-[11px] bg-indigo-50/30 border-indigo-100"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeSubTaskField(update.id, idx, si)}
                                      className="h-5 w-5 text-gray-300 hover:text-red-500 opacity-0 group-hover/asub:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addSubTaskField(update.id, idx)}
                                  className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 hover:text-indigo-700 pl-4 py-0.5 transition-colors"
                                >
                                  <Plus className="h-2.5 w-2.5" /> Add subtask
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <Button variant="outline" size="sm" onClick={() => addTaskField(update.id)} className="text-[11px] h-7">
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleSaveTasks(update.id)} className="text-[11px] h-7">
                            <Save className="h-3 w-3 mr-1" /> Save
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveTasks(update.id, "REVIEWED")}
                            className="text-[11px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Reviewed
                          </Button>
                        </div>

                        {update.adminNotes.length > 0 && (
                          <div className="border-t border-gray-100 pt-2.5 mt-2 space-y-1.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
                            {update.adminNotes.map((note) => (
                              <div key={note.id} className="text-[12px] bg-amber-50/80 p-2 rounded-lg border border-amber-100">
                                <p className="text-gray-700">{note.note}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">— {note.createdBy.name}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <Textarea
                            placeholder="Add a note..."
                            value={noteInputs[update.id] || ""}
                            onChange={(e) =>
                              setNoteInputs((prev) => ({ ...prev, [update.id]: e.target.value }))
                            }
                            className="text-[12px] min-h-[50px] bg-gray-50/60 border-gray-200"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddNote(update.id)}
                            className="flex-shrink-0 h-8 w-8"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[12px] text-gray-400 italic py-2">
                        No update submitted for this date.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <AdminAttendanceView selectedDate={selectedDate} />
      )}
    </div>
  );
}
