"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, updateSettings } from "@/actions/settings-actions";
import {
  getTaskStatusUsageCounts,
  createTaskStatus,
  updateTaskStatus,
  deleteTaskStatus,
} from "@/actions/task-status-actions";
import { toast } from "sonner";
import { Save, Loader2, Settings, Eye, Plus, Trash2, Tag, GripVertical, Power } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskStatusItem {
  id: string;
  label: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
}

export default function SettingsPage() {
  const [settings, setSettingsState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statuses, setStatuses] = useState<TaskStatusItem[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => { loadSettings(); loadStatuses(); }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettingsState(data);
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  };

  const loadStatuses = async () => {
    try {
      const data = await getTaskStatusUsageCounts();
      setStatuses(data);
    } catch { toast.error("Failed to load task statuses"); }
    finally { setStatusLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("Settings saved");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const updateField = (key: string, value: string) => {
    setSettingsState((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddStatus = async () => {
    if (!newLabel.trim()) { toast.error("Enter a status label"); return; }
    try {
      await createTaskStatus(newLabel.trim(), newColor);
      setNewLabel("");
      setNewColor("#6366f1");
      toast.success("Status added");
      loadStatuses();
    } catch (e: any) {
      toast.error(e.message || "Failed to add status");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateTaskStatus(id, { isActive: !isActive });
      toast.success(isActive ? "Status deactivated" : "Status activated");
      loadStatuses();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await updateTaskStatus(id, { isDefault: true });
      toast.success("Default status updated");
      loadStatuses();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteStatus = async (id: string) => {
    try {
      await deleteTaskStatus(id);
      toast.success("Status deleted");
      loadStatuses();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateColor = async (id: string, color: string) => {
    try {
      await updateTaskStatus(id, { color });
      loadStatuses();
    } catch { /* silent */ }
  };

  const handleUpdateLabel = async (id: string, label: string) => {
    if (!label.trim()) return;
    try {
      await updateTaskStatus(id, { label: label.trim() });
      loadStatuses();
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Configure report template, task statuses, and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Report Template */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              Report Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Greeting</Label>
              <Input value={settings.greeting_template || ""} onChange={(e) => updateField("greeting_template", e.target.value)} placeholder="Assalam o Alikum Sir!" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Report Header</Label>
              <Input value={settings.report_header || ""} onChange={(e) => updateField("report_header", e.target.value)} placeholder="OAS Dev - Update" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Report Footer</Label>
              <Input value={settings.report_footer || ""} onChange={(e) => updateField("report_footer", e.target.value)} placeholder="FIP" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Member Prefix</Label>
              <Input value={settings.member_prefix || ""} onChange={(e) => updateField("member_prefix", e.target.value)} placeholder="🔸" className="h-9 text-sm w-32" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-500" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-b from-gray-50/80 to-white p-5 rounded-lg border border-gray-100 text-[13px] font-mono whitespace-pre-wrap leading-[1.8] text-gray-700">
              {settings.greeting_template || "Assalam o Alikum Sir!"}
              {"\n"}
              {settings.report_header || "OAS Dev - Update"}
              {"\n"}
              DD-MMM-YY{"\n\n"}
              Tasks{"\n\n"}
              {settings.member_prefix || "🔸"} Mr. Example.{"\n"}
              1. Sample task description - Completed{"\n"}
              2. Another task description - In Progress{"\n\n"}
              Attendance{"\n"}
              {settings.member_prefix || "🔸"} Mr. Example - Present{"\n"}
              {settings.member_prefix || "🔸"} Mr. Another - Leave - Personal work{"\n\n"}
              {settings.report_footer || "FIP"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Statuses Section */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              Task Statuses
            </CardTitle>
            <span className="text-[11px] text-gray-400">Admin-managed lookup values for task progress tracking</span>
          </div>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Existing statuses */}
              <div className="space-y-2">
                {statuses.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                      s.isActive ? "bg-white border-gray-100" : "bg-gray-50/50 border-gray-100 opacity-60"
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    <input
                      type="color"
                      value={s.color}
                      onChange={(e) => handleUpdateColor(s.id, e.target.value)}
                      className="h-7 w-7 rounded border-0 cursor-pointer flex-shrink-0"
                    />
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: `${s.color}15`, color: s.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </div>
                    <Input
                      defaultValue={s.label}
                      onBlur={(e) => {
                        if (e.target.value !== s.label) handleUpdateLabel(s.id, e.target.value);
                      }}
                      className="flex-1 h-8 text-sm bg-transparent border-gray-200"
                    />
                    <span className="text-[10px] text-gray-400 flex-shrink-0 w-16 text-right">
                      {s.usageCount} task{s.usageCount !== 1 ? "s" : ""}
                    </span>
                    {s.isDefault ? (
                      <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        DEFAULT
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(s.id)}
                        className="text-[9px] font-medium text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(s.id, s.isActive)}
                      className={cn(
                        "h-7 w-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0",
                        s.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"
                      )}
                      title={s.isActive ? "Deactivate" : "Activate"}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStatus(s.id)}
                      disabled={s.usageCount > 0}
                      className={cn(
                        "h-7 w-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0",
                        s.usageCount > 0 ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      )}
                      title={s.usageCount > 0 ? "In use — deactivate instead" : "Delete"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new status */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/30">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-7 w-7 rounded border-0 cursor-pointer flex-shrink-0"
                />
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="New status label..."
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddStatus(); }}
                />
                <Button size="sm" onClick={handleAddStatus} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Status
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
