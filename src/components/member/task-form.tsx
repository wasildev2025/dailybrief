"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Send, Copy, Loader2, ListChecks, ChevronDown, ChevronRight, CornerDownRight } from "lucide-react";
import { saveUpdate, getUpdateForDate, isDateLocked, copyPreviousDayTasks, TaskInput } from "@/actions/update-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { formatDateISO } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  selectedDate: Date;
  userId: string;
}

interface LocalTask {
  text: string;
  subTasks: string[];
  expanded: boolean;
}

export function TaskForm({ selectedDate, userId }: TaskFormProps) {
  const [tasks, setTasks] = useState<LocalTask[]>([{ text: "", subTasks: [], expanded: false }]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [updateId, setUpdateId] = useState<string | null>(null);

  useEffect(() => {
    loadUpdate();
  }, [selectedDate]);

  const loadUpdate = async () => {
    setLoading(true);
    try {
      const dateStr = formatDateISO(selectedDate);
      const [update, isLck] = await Promise.all([
        getUpdateForDate(dateStr),
        isDateLocked(dateStr),
      ]);

      setLocked(isLck);
      if (update) {
        setUpdateId(update.id);
        setStatus(update.status);
        setTasks(
          update.tasks.length > 0
            ? update.tasks.map((t) => ({
                text: t.text,
                subTasks: t.subTasks.length > 0 ? t.subTasks.map((s) => s.text) : [],
                expanded: t.subTasks.length > 0,
              }))
            : [{ text: "", subTasks: [], expanded: false }]
        );
      } else {
        setUpdateId(null);
        setStatus(null);
        setTasks([{ text: "", subTasks: [], expanded: false }]);
      }
    } catch {
      toast.error("Failed to load update");
    } finally {
      setLoading(false);
    }
  };

  const addTask = () => setTasks([...tasks, { text: "", subTasks: [], expanded: false }]);

  const removeTask = (index: number) => {
    if (tasks.length === 1) return;
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTaskText = (index: number, value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], text: value };
    setTasks(updated);
  };

  const toggleExpanded = (index: number) => {
    const updated = [...tasks];
    const task = updated[index];
    if (!task.expanded && task.subTasks.length === 0) {
      updated[index] = { ...task, expanded: true, subTasks: [""] };
    } else {
      updated[index] = { ...task, expanded: !task.expanded };
    }
    setTasks(updated);
  };

  const addSubTask = (taskIndex: number) => {
    const updated = [...tasks];
    updated[taskIndex] = {
      ...updated[taskIndex],
      subTasks: [...updated[taskIndex].subTasks, ""],
      expanded: true,
    };
    setTasks(updated);
  };

  const removeSubTask = (taskIndex: number, subIndex: number) => {
    const updated = [...tasks];
    const subs = updated[taskIndex].subTasks.filter((_, i) => i !== subIndex);
    updated[taskIndex] = {
      ...updated[taskIndex],
      subTasks: subs,
      expanded: subs.length > 0,
    };
    setTasks(updated);
  };

  const updateSubTaskText = (taskIndex: number, subIndex: number, value: string) => {
    const updated = [...tasks];
    const subs = [...updated[taskIndex].subTasks];
    subs[subIndex] = value;
    updated[taskIndex] = { ...updated[taskIndex], subTasks: subs };
    setTasks(updated);
  };

  const handleSave = async (submitStatus: "DRAFT" | "SUBMITTED") => {
    const nonEmpty = tasks.filter((t) => t.text.trim() !== "");
    if (submitStatus === "SUBMITTED" && nonEmpty.length === 0) {
      toast.error("Add at least one task before submitting");
      return;
    }
    setSaving(true);
    try {
      const payload: TaskInput[] = tasks.map((t) => ({
        text: t.text,
        subTasks: t.subTasks,
      }));
      const result = await saveUpdate(formatDateISO(selectedDate), payload, submitStatus);
      if (result.success) {
        setUpdateId(result.id);
        setStatus(submitStatus);
        toast.success(submitStatus === "DRAFT" ? "Draft saved" : "Update submitted!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPrevious = async () => {
    try {
      const result = await copyPreviousDayTasks(formatDateISO(selectedDate));
      if (result.tasks.length > 0) {
        setTasks(
          result.tasks.map((t) => ({
            text: t.text,
            subTasks: t.subTasks,
            expanded: t.subTasks.length > 0,
          }))
        );
        toast.success("Previous tasks copied");
      } else {
        toast.info("No previous tasks found");
      }
    } catch {
      toast.error("Failed to copy previous tasks");
    }
  };

  const isReadOnly = locked || status === "REVIEWED";

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="flex items-center justify-center py-16">
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
            <ListChecks className="h-4 w-4 text-gray-500" />
            Tasks
          </CardTitle>
          <div className="flex items-center gap-2">
            {locked && (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Locked
              </span>
            )}
            {status && <StatusBadge status={status as any} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.map((task, index) => (
          <div key={index} className="group/task">
            {/* Main task row */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-400 w-5 text-right flex-shrink-0 font-mono">
                {index + 1}
              </span>

              {/* Expand toggle */}
              <button
                type="button"
                onClick={() => toggleExpanded(index)}
                disabled={isReadOnly}
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex-shrink-0",
                  task.expanded && "text-indigo-600 bg-indigo-50",
                  isReadOnly && "opacity-50 pointer-events-none"
                )}
                title={task.expanded ? "Collapse subtasks" : "Add subtasks"}
              >
                {task.expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>

              <Input
                value={task.text}
                onChange={(e) => updateTaskText(index, e.target.value)}
                placeholder="Describe your task..."
                disabled={isReadOnly}
                className="flex-1 h-9 text-sm bg-gray-50/60 border-gray-200 focus:bg-white transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addTask();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTask(index)}
                disabled={isReadOnly || tasks.length === 1}
                className="h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Subtasks */}
            {task.expanded && (
              <div className="ml-[52px] mt-1 mb-2 pl-3 border-l-2 border-indigo-100 space-y-1">
                {task.subTasks.map((sub, si) => (
                  <div key={si} className="flex items-center gap-2 group/sub">
                    <CornerDownRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
                    <span className="text-[10px] text-gray-400 w-4 text-right flex-shrink-0 font-mono">
                      {index + 1}.{si + 1}
                    </span>
                    <Input
                      value={sub}
                      onChange={(e) => updateSubTaskText(index, si, e.target.value)}
                      placeholder="Subtask detail..."
                      disabled={isReadOnly}
                      className="flex-1 h-7 text-[12px] bg-indigo-50/30 border-indigo-100 focus:bg-white transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addSubTask(index);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubTask(index, si)}
                      disabled={isReadOnly}
                      className="h-6 w-6 text-gray-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => addSubTask(index)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-500 hover:text-indigo-700 pl-7 py-1 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add subtask
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {!isReadOnly && (
          <>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={addTask} className="text-xs h-7">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyPrevious} className="text-xs h-7">
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Previous
              </Button>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave("DRAFT")}
                disabled={saving}
                className="text-xs"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave("SUBMITTED")}
                disabled={saving}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Submit Update
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
