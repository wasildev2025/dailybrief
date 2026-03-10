"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { format } from "date-fns";
import { NotificationBell } from "@/components/shared/notification-bell";

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  member: "Member",
  viewer: "Executive",
  calendar: "Calendar",
  reports: "Reports",
  range: "Date Range",
  users: "Users",
  settings: "Settings",
  kpi: "KPI",
  activity: "Activity Log",
};

export function PageHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((seg, i) => ({
    label: breadcrumbLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <div className="relative z-50 flex items-center justify-between h-12 px-4 sm:px-6 lg:px-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <nav className="flex items-center gap-1 text-[12px]">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          <Home className="h-3.5 w-3.5" />
        </Link>
        {breadcrumbs.slice(1).map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-gray-300" />
            {crumb.isLast ? (
              <span className="font-medium text-gray-700">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <span className="text-[11px] text-gray-400 font-medium hidden sm:block">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </span>
      </div>
    </div>
  );
}
