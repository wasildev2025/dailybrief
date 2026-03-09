"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, updateSettings } from "@/actions/settings-actions";
import { toast } from "sonner";
import { Save, Loader2, Settings, Eye } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettingsState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettingsState(data);
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Configure the report template and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
              <Input
                value={settings.greeting_template || ""}
                onChange={(e) => updateField("greeting_template", e.target.value)}
                placeholder="Assalam o Alikum Sir!"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Report Header</Label>
              <Input
                value={settings.report_header || ""}
                onChange={(e) => updateField("report_header", e.target.value)}
                placeholder="OAS Dev - Update"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Report Footer</Label>
              <Input
                value={settings.report_footer || ""}
                onChange={(e) => updateField("report_footer", e.target.value)}
                placeholder="FIP"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Member Prefix</Label>
              <Input
                value={settings.member_prefix || ""}
                onChange={(e) => updateField("member_prefix", e.target.value)}
                placeholder="🔸"
                className="h-9 text-sm w-32"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

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
              1. Sample task description{"\n"}
              2. Another task description{"\n\n"}
              Attendance{"\n"}
              {settings.member_prefix || "🔸"} Mr. Example - Present{"\n"}
              {settings.member_prefix || "🔸"} Mr. Another - Leave - Personal work{"\n\n"}
              {settings.report_footer || "FIP"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
