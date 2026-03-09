import { format, parse } from "date-fns";

export function formatDateDDMMMYY(date: Date): string {
  return format(date, "dd-MMM-yy");
}

export function formatDateForDisplay(date: Date): string {
  return format(date, "MMMM d, yyyy");
}

export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateISO(dateStr: string): Date {
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

export function toDateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return formatDateISO(a) === formatDateISO(b);
}
