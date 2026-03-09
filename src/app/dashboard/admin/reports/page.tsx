"use client";

import { useState, useEffect, useRef } from "react";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAllUpdatesForDate, lockDate } from "@/actions/update-actions";
import { getAllAttendanceForDate } from "@/actions/attendance-actions";
import { getSettings } from "@/actions/settings-actions";
import { formatDateISO, formatDateForDisplay } from "@/lib/date-utils";
import {
  generateReportText,
  generateReportHTML,
  ReportConfig,
  ReportMember,
  ReportAttendance,
} from "@/lib/report-generator";
import { toast } from "sonner";
import {
  Copy,
  Download,
  FileText,
  Eye,
  Lock,
  Loader2,
  Printer,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import jsPDF from "jspdf";

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<ReportMember[]>([]);
  const [attendance, setAttendance] = useState<ReportAttendance[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const dateStr = formatDateISO(selectedDate);
      const [data, attData] = await Promise.all([
        getAllUpdatesForDate(dateStr),
        getAllAttendanceForDate(dateStr),
      ]);

      const memberList: ReportMember[] = data
        .filter((d) => d.user.role === "MEMBER")
        .map((d) => ({
          name: d.user.name,
          tasks: d.update?.tasks.map((t) => t.text) || [],
        }));

      const attList: ReportAttendance[] = attData.map((a) => ({
        name: a.user.name,
        status: a.attendance?.status || "UNMARKED",
        reason: a.attendance?.reason,
      }));

      setMembers(memberList);
      setAttendance(attList);

      const config: ReportConfig = {
        greeting: settings.greeting_template || "Assalam o Alikum Sir!",
        header: settings.report_header || "OAS Dev - Update",
        footer: settings.report_footer || "FIP",
        memberPrefix: settings.member_prefix || "🔸",
        date: selectedDate,
        members: memberList,
        attendance: attList,
        showAll,
      };

      const text = generateReportText(config);
      setReportText(text);
      setGenerated(true);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      toast.success("Report copied to clipboard");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = reportText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Report copied to clipboard");
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-brief-${formatDateISO(selectedDate)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("TXT file downloaded");
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth() - 2 * margin;
    let y = margin;

    const lines = reportText.split("\n");
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }

      const isBulletLine = line.includes("🔸") || line.startsWith("🔸");
      if (isBulletLine) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        const cleanLine = line.replace(/🔸/g, ">>").trim();
        const wrapped = doc.splitTextToSize(cleanLine, pageWidth);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 5 + 2;
      } else if (line.match(/^\d+\./)) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(line, pageWidth - 10);
        doc.text(wrapped, margin + 5, y);
        y += wrapped.length * 5;
      } else if (line.trim() === "") {
        y += 4;
      } else if (line === "Tasks" || line === "Attendance") {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(line, margin, y);
        y += 7;
      } else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(line, margin, y);
        y += 6;
      }
    }

    doc.save(`daily-brief-${formatDateISO(selectedDate)}.pdf`);
    toast.success("PDF downloaded");
  };

  const handlePrint = () => {
    const config: ReportConfig = {
      greeting: settings.greeting_template || "Assalam o Alikum Sir!",
      header: settings.report_header || "OAS Dev - Update",
      footer: settings.report_footer || "FIP",
      memberPrefix: settings.member_prefix || "🔸",
      date: selectedDate,
      members,
      attendance,
      showAll,
    };

    const html = generateReportHTML(config);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handleFinalize = async () => {
    try {
      await lockDate(formatDateISO(selectedDate));
      toast.success("Date finalized and locked");
    } catch {
      toast.error("Failed to finalize date");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Report Generator</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Generate, preview, and export the daily brief
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        <div className="flex flex-wrap items-center gap-4">
          <DatePickerField
            date={selectedDate}
            onSelect={(d) => {
              if (d) {
                setSelectedDate(d);
                setGenerated(false);
              }
            }}
          />
          <span className="text-sm text-gray-500 font-medium">
            {formatDateForDisplay(selectedDate)}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Switch
              id="show-all"
              checked={showAll}
              onCheckedChange={setShowAll}
            />
            <Label htmlFor="show-all" className="text-xs text-gray-600">
              Show all members
            </Label>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            Generate Brief
          </Button>
        </div>
      </div>

      {generated && (
        <>
          {/* Editor + Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold text-gray-600 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Edit Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="min-h-[450px] font-mono text-[12px] leading-relaxed bg-gray-50/60 border-gray-200"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold text-gray-600 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewRef}
                  className="min-h-[450px] p-5 bg-gradient-to-b from-gray-50/80 to-white border border-gray-100 rounded-lg whitespace-pre-wrap text-[13px] font-sans leading-[1.7] text-gray-800"
                >
                  {reportText}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopy} className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Final Brief
              </Button>
              <Button variant="outline" onClick={handleCopy} size="sm" className="text-xs">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
              </Button>
              <Button variant="outline" onClick={handleDownloadTxt} size="sm" className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" /> TXT
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF} size="sm" className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
              </Button>
              <Button variant="outline" onClick={handlePrint} size="sm" className="text-xs">
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
              </Button>
              <Button
                variant="destructive"
                onClick={handleFinalize}
                size="sm"
                className="ml-auto text-xs"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" /> Finalize Date
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
