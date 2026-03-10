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
  adminCreateUpdateForUser,
  addAdminNote,
  lockDate,
  unlockDate,
  isDateLocked,
} from "@/actions/update-actions";
import { getTaskStatuses } from "@/actions/task-status-actions";
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
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskInput } from "@/actions/update-actions";

interface TaskStatusOption {
  id: string;
  label: string;
  color: string;
}

interface UserUpdate {
  user: { id: string; name: string; email: string; role: string; displayOrder: number };
  update: {
    id: string;
    status: string;
    tasks: { id: string; text: string; statusId: string | null; sortOrder: number; taskStatus: TaskStatusOption | null; subTasks: { id: string; text: string; sortOrder: number }[] }[];
    adminNotes: { id: string; note: string; createdBy: { name: string }; createdAt: Date }[];
  } | null;
}

interface EditableTask {
  text: string;
  subTasks: string[];
  expanded: boolean;
  statusId: string | null;
}

export function AdminDateView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [userUpdates, setUserUpdates] = useState<UserUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [editedTasks, setEditedTasks] = useState<Record<string, EditableTask[]>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"tasks" | "attendance">("tasks");
  const [taskStatuses, setTaskStatuses] = useState<TaskStatusOption[]>([]);
  const [newUpdateTasks, setNewUpdateTasks] = useState<Record<string, EditableTask[]>>({});

  useEffect(() => { loadData(); loadStatuses(); }, [selectedDate]);

  const loadStatuses = async () => {
    try {
      const data = await getTaskStatuses();
      setTaskStatuses(data);
    } catch { /* silent */ }
  };

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
            statusId: t.statusId || null,
          }));
        }
      });
      setEditedTasks(edits);
      setNewUpdateTasks({});
    } catch {
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTasks = async (updateId: string, status?: "DRAFT" | "SUBMITTED" | "REVIEWED" | "FINALIZED") => {
    try {
      const payload: TaskInput[] = (editedTasks[updateId] || []).map((t) => ({
        text: t.text,
        subTasks: t.subTasks,
        statusId: t.statusId,
      }));
      await adminSaveUpdate(updateId, payload, status);
      const msg = status === "FINALIZED" ? "Update finalized" : status === "REVIEWED" ? "Marked as reviewed" : "Update saved";
      toast.success(msg);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    }
  };

  const handleCreateForUser = async (userId: string) => {
    const tasks = newUpdateTasks[userId];
    if (!tasks || tasks.every((t) => !t.text.trim())) {
      toast.error("Add at least one task");
      return;
    }
    try {
      const payload: TaskInput[] = tasks.map((t) => ({
        text: t.text,
        subTasks: t.subTasks,
        statusId: t.statusId,
      }));
      await adminCreateUpdateForUser(userId, formatDateISO(selectedDate), payload, "SUBMITTED");
      toast.success("Tasks created for member");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create");
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
    } catch { toast.error("Failed to add note"); }
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
    } catch { toast.error("Failed to toggle lock"); }
  };

  // ---- Task editing helpers (for existing updates) ----
  const updateTaskText = (key: string, index: number, value: string, isNew = false) => {
    const setter = isNew ? setNewUpdateTasks : setEditedTasks;
    setter((prev) => {
      const tasks = [...(prev[key] || [])];
      tasks[index] = { ...tasks[index], text: value };
      return { ...prev, [key]: tasks };
    });
  };

  const updateTaskStatusId = (key: string, index: number, statusId: string | null, isNew = false) => {
    const setter = isNew ? setNewUpdateTasks : setEditedTasks;
    setter((prev) => {
      const tasks = [...(prev[key] || [])];
      tasks[index] = { ...tasks[index], statusId };
      return { ...prev, [key]: tasks };
    });
  };

  const addTaskField = (key: string, isNew = false) => {
    const setter = isNew ? setNewUpdateTasks : setEditedTasks;
    setter((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), { text: "", subTasks: [], expanded: false, statusId: null }],
    }));
  };

  const removeTaskField = (key: string, index: number, isNew = false) => {
    const setter = isNew ? setNewUpdateTasks : setEditedTasks;
    setter((prev) => {
      const tasks = [...(prev[key] || [])];
      tasks.splice(index, 1);
      return { ...prev, [key]: tasks.length ? tasks : [{ text: "", subTasks: [], expanded: false, statusId: null }] };
    });
  };

  const toggleTaskExpanded = (key: string, index: number, isNew = false) => {
    const setter = isNew ? setNewUpdateTasks : setEditedTasks;
    setter((prev) => {
      const tasks = [...(prev[key] || [])];
      const task = tasks[index];
      tasks[index] = !task.expanded && task.subTasks.length === 0
        ? { ...task, expanded: true, subTasks: [""] }
        : { ...task, expanded: !task.expanded };
      return { ...prev, [key]: tasks };
    });
  };

  const addSubTaskField = (key: string, taskIndex: number, isNew = false) => {
    const setter = isNew ? setNewUpdateTasks : setEditedTasks;
    setter((prev) => {
      const tasks = [...(prev[key] || [])];
      tasks[taskIndex] = { ...tasks[taskIndex], subTasks: [...tasks[taskIndex].subTasks, ""], expanded: true };
      return { ...prev, [key]: tasks };
    });
  };

  const removeSubTaskField = (key: string, taskIndex: number, subIndex: number, isNew = false) => {
    const setter = isNew ? setNewUpdateTasks : setEditedTasks;
    setter((prev) => {
      const tasks = [...(prev[key] || [])];
      const subs = tasks[taskIndex].subTasks.filter((_, i) => i !== subIndex);
      tasks[taskIndex] = { ...tasks[taskIndex], subTasks: subs, expanded: subs.length > 0 };
      return { ...prev, [key]: tasks };
    });
  };

  const updateSubTaskText = (key: string, taskIndex: number, subIndex: number, value: string, isNew = false) => {
    const setter = isNew ? setNewUpdateTasks : setEditedTasks;
    setter((prev) => {
      const tasks = [...(prev[key] || [])];
      const subs = [...tasks[taskIndex].subTasks];
      subs[subIndex] = value;
      tasks[taskIndex] = { ...tasks[taskIndex], subTasks: subs };
      return { ...prev, [key]: tasks };
    });
  };

  const memberUpdates = userUpdates.filter((u) => u.user.role === "MEMBER");

  const renderTaskRows = (tasks: EditableTask[], key: string, isNew: boolean) => (
    <>
      {tasks.map((task, idx) => (
        <div key={idx} className="group/atask">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 w-5 text-right flex-shrink-0 font-mono">{idx + 1}</span>
            <button type="button" onClick={() => toggleTaskExpanded(key, idx, isNew)} className={cn("h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex-shrink-0", task.expanded && "text-indigo-600 bg-indigo-50")}>
              {task.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            <Input value={task.text} onChange={(e) => updateTaskText(key, idx, e.target.value, isNew)} className="flex-1 h-8 text-sm bg-gray-50/60 border-gray-200" placeholder="Task description..." />
            {/* Task Status Selector */}
            <select
              value={task.statusId || ""}
              onChange={(e) => updateTaskStatusId(key, idx, e.target.value || null, isNew)}
              className="h-8 rounded-lg border border-gray-200 bg-white text-[10px] font-medium px-2 appearance-none cursor-pointer min-w-[100px]"
              style={task.statusId ? { color: taskStatuses.find((s) => s.id === task.statusId)?.color } : {}}
            >
              <option value="">No status</option>
              {taskStatuses.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <Button variant="ghost" size="icon" onClick={() => removeTaskField(key, idx, isNew)} className="h-7 w-7 text-gray-300 hover:text-red-500 opacity-0 group-hover/atask:opacity-100 transition-opacity">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {task.expanded && (
            <div className="ml-[44px] mt-1 mb-1.5 pl-2.5 border-l-2 border-indigo-100 space-y-1">
              {task.subTasks.map((sub, si) => (
                <div key={si} className="flex items-center gap-1.5 group/asub">
                  <CornerDownRight className="h-2.5 w-2.5 text-gray-300 flex-shrink-0" />
                  <Input value={sub} onChange={(e) => updateSubTaskText(key, idx, si, e.target.value, isNew)} className="flex-1 h-6 text-[11px] bg-indigo-50/30 border-indigo-100" />
                  <Button variant="ghost" size="icon" onClick={() => removeSubTaskField(key, idx, si, isNew)} className="h-5 w-5 text-gray-300 hover:text-red-500 opacity-0 group-hover/asub:opacity-100 transition-opacity"><Trash2 className="h-2.5 w-2.5" /></Button>
                </div>
              ))}
              <button type="button" onClick={() => addSubTaskField(key, idx, isNew)} className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 hover:text-indigo-700 pl-4 py-0.5 transition-colors">
                <Plus className="h-2.5 w-2.5" /> Add subtask
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <DatePickerField date={selectedDate} onSelect={(d) => d && setSelectedDate(d)} />
          <span className="text-sm font-medium text-gray-600">{formatDateForDisplay(selectedDate)}</span>
          <div className="ml-auto flex items-center gap-2">
            {locked && (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-100">Date Locked</span>
            )}
            <Button variant={locked ? "destructive" : "outline"} onClick={handleToggleLock} size="sm" className="text-xs">
              {locked ? <><Unlock className="h-3.5 w-3.5 mr-1" /> Unlock</> : <><Lock className="h-3.5 w-3.5 mr-1" /> Lock Date</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button onClick={() => setActiveTab("tasks")} className={cn("px-4 py-1.5 rounded-md text-xs font-medium transition-all", activeTab === "tasks" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <ListChecks className="h-3.5 w-3.5 inline mr-1.5" /> Task Updates
        </button>
        <button onClick={() => setActiveTab("attendance")} className={cn("px-4 py-1.5 rounded-md text-xs font-medium transition-all", activeTab === "attendance" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <CheckCircle className="h-3.5 w-3.5 inline mr-1.5" /> Attendance
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 rounded bg-gray-100" />
                      <div className="h-3 w-24 rounded bg-gray-100" />
                    </div>
                    <div className="ml-auto h-5 w-20 rounded-full bg-gray-100" />
                  </div>
                  <div className="space-y-2 pt-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="h-8 w-full rounded-lg bg-gray-50" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : memberUpdates.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No team members" description="Add team members from the Users page" />
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
                        {update.status === "FINALIZED" ? (
                          /* Finalized: read-only task display */
                          <div className="space-y-1.5">
                            {(editedTasks[update.id] || []).map((task, idx) => (
                              <div key={idx} className="flex items-start gap-2 py-1">
                                <span className="text-[11px] text-gray-400 w-5 text-right flex-shrink-0 font-mono mt-0.5">{idx + 1}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-700">{task.text}</p>
                                    {task.statusId && (
                                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${taskStatuses.find((s) => s.id === task.statusId)?.color}15`, color: taskStatuses.find((s) => s.id === task.statusId)?.color }}>
                                        {taskStatuses.find((s) => s.id === task.statusId)?.label}
                                      </span>
                                    )}
                                  </div>
                                  {task.subTasks.length > 0 && (
                                    <div className="ml-3 mt-1 pl-2.5 border-l-2 border-gray-100 space-y-0.5">
                                      {task.subTasks.map((sub, si) => (
                                        <p key={si} className="text-[12px] text-gray-500">{idx + 1}.{si + 1}. {sub}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            <div className="flex items-center gap-1.5 pt-2">
                              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Finalized — Read Only
                              </span>
                              <Button variant="outline" size="sm" onClick={() => handleSaveTasks(update.id, "REVIEWED")} className="text-[11px] h-7 ml-auto">
                                Revert to Reviewed
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Editable task rows */
                          <>
                            {renderTaskRows(editedTasks[update.id] || [], update.id, false)}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2">
                              <Button variant="outline" size="sm" onClick={() => addTaskField(update.id)} className="text-[11px] h-7">
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleSaveTasks(update.id)} className="text-[11px] h-7">
                                <Save className="h-3 w-3 mr-1" /> Save
                              </Button>
                              {update.status !== "REVIEWED" ? (
                                <Button size="sm" onClick={() => handleSaveTasks(update.id, "REVIEWED")} className="text-[11px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Reviewed
                                </Button>
                              ) : (
                                <Button size="sm" onClick={() => handleSaveTasks(update.id, "FINALIZED")} className="text-[11px] h-7 bg-indigo-600 hover:bg-indigo-700 text-white">
                                  <ShieldCheck className="h-3 w-3 mr-1" /> Finalize
                                </Button>
                              )}
                            </div>
                          </>
                        )}

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
                            onChange={(e) => setNoteInputs((prev) => ({ ...prev, [update.id]: e.target.value }))}
                            className="text-[12px] min-h-[50px] bg-gray-50/60 border-gray-200"
                          />
                          <Button variant="outline" size="icon" onClick={() => handleAddNote(update.id)} className="flex-shrink-0 h-8 w-8">
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Admin can create tasks for members who haven't submitted */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">No update submitted</span>
                          {!(newUpdateTasks[user.id]?.length) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewUpdateTasks((prev) => ({ ...prev, [user.id]: [{ text: "", subTasks: [], expanded: false, statusId: null }] }))}
                              className="text-[11px] h-7"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Tasks for this Member
                            </Button>
                          )}
                        </div>
                        {newUpdateTasks[user.id] && (
                          <>
                            {renderTaskRows(newUpdateTasks[user.id], user.id, true)}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2">
                              <Button variant="outline" size="sm" onClick={() => addTaskField(user.id, true)} className="text-[11px] h-7">
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                              <Button size="sm" onClick={() => handleCreateForUser(user.id)} className="text-[11px] h-7 bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Save className="h-3 w-3 mr-1" /> Save & Submit
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && <AdminAttendanceView selectedDate={selectedDate} />}
    </div>
  );
}
