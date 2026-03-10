import { formatDateDDMMMYY } from "./date-utils";

export interface ReportTask {
  text: string;
  subTasks: string[];
}

export interface ReportMember {
  name: string;
  tasks: ReportTask[];
}

export interface ReportAttendance {
  name: string;
  status: string;
  reason?: string | null;
}

export interface ReportConfig {
  greeting: string;
  header: string;
  footer: string;
  memberPrefix: string;
  date: Date;
  members: ReportMember[];
  attendance: ReportAttendance[];
  showAll?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LEAVE: "Leave",
  HALF_DAY: "Half Day",
  REMOTE: "Remote",
};

export function generateReportText(config: ReportConfig): string {
  const lines: string[] = [];

  lines.push(config.greeting);
  lines.push(config.header);
  lines.push(formatDateDDMMMYY(config.date));
  lines.push("");
  lines.push("Tasks");
  lines.push("");

  const filteredMembers = config.showAll
    ? config.members
    : config.members.filter((m) => m.tasks.length > 0);

  for (const member of filteredMembers) {
    lines.push(`${config.memberPrefix} ${member.name}.`);
    if (member.tasks.length > 0) {
      member.tasks.forEach((task, i) => {
        lines.push(`${i + 1}. ${task.text}`);
        if (task.subTasks.length > 0) {
          task.subTasks.forEach((sub, si) => {
            lines.push(`   ${i + 1}.${si + 1}. ${sub}`);
          });
        }
      });
    } else {
      lines.push("No updates submitted.");
    }
    lines.push("");
  }

  if (config.attendance.length > 0) {
    lines.push("Attendance");
    for (const att of config.attendance) {
      const statusLabel = STATUS_LABELS[att.status] || att.status;
      const reasonPart = att.reason ? ` - ${att.reason}` : "";
      lines.push(`${config.memberPrefix} ${att.name} - ${statusLabel}${reasonPart}`);
    }
    lines.push("");
  }

  lines.push(config.footer);

  return lines.join("\n");
}

export function generateReportHTML(config: ReportConfig): string {
  const dateStr = formatDateDDMMMYY(config.date);

  const filteredMembers = config.showAll
    ? config.members
    : config.members.filter((m) => m.tasks.length > 0);

  const membersHTML = filteredMembers
    .map((member) => {
      const tasksHTML =
        member.tasks.length > 0
          ? `<ol style="margin:4px 0 0 20px;padding:0;">${member.tasks.map((t) => {
              const subHTML = t.subTasks.length > 0
                ? `<ul style="margin:2px 0 4px 16px;padding:0;list-style:disc;">${t.subTasks.map((s) => `<li style="margin-bottom:1px;font-size:0.9em;">${s}</li>`).join("")}</ul>`
                : "";
              return `<li style="margin-bottom:4px;">${t.text}${subHTML}</li>`;
            }).join("")}</ol>`
          : `<p style="margin:4px 0 0 20px;color:#666;">No updates submitted.</p>`;
      return `<div style="margin-bottom:16px;"><p style="font-weight:600;margin:0;">${config.memberPrefix} ${member.name}.</p>${tasksHTML}</div>`;
    })
    .join("");

  let attendanceHTML = "";
  if (config.attendance.length > 0) {
    const attItems = config.attendance
      .map((att) => {
        const statusLabel = STATUS_LABELS[att.status] || att.status;
        const reasonPart = att.reason ? ` - ${att.reason}` : "";
        return `<p style="margin:4px 0;">${config.memberPrefix} ${att.name} - <strong>${statusLabel}</strong>${reasonPart}</p>`;
      })
      .join("");
    attendanceHTML = `<h2 style="margin-top:24px;">Attendance</h2>${attItems}`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Daily Brief - ${dateStr}</title>
<style>body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#222;line-height:1.6;}
h1{font-size:16px;margin:0;}h2{font-size:14px;margin:8px 0;color:#444;}
.date{font-size:13px;color:#666;margin-bottom:20px;}.footer{margin-top:24px;font-weight:600;font-size:14px;}
@media print{body{margin:0;padding:20px;}}</style></head>
<body>
<h1>${config.greeting}</h1>
<h2>${config.header}</h2>
<p class="date">${dateStr}</p>
<h2>Tasks</h2>
${membersHTML}
${attendanceHTML}
<p class="footer">${config.footer}</p>
</body></html>`;
}
