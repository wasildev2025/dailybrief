"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Users, Settings, LogOut,
  ClipboardList, CalendarDays, Menu, X, Zap, BarChart3,
  Activity, CalendarRange,
} from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";

interface MobileNavProps {
  role: string;
  userName: string;
}

const adminLinks = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/admin/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/admin/reports/range", label: "Date Range", icon: CalendarRange },
  { href: "/dashboard/admin/kpi", label: "KPI", icon: BarChart3 },
  { href: "/dashboard/admin/activity", label: "Activity Log", icon: Activity },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

const memberLinks = [
  { href: "/dashboard/member", label: "My Updates", icon: ClipboardList },
  { href: "/dashboard/member/calendar", label: "Calendar", icon: CalendarDays },
];

const viewerLinks = [
  { href: "/dashboard/viewer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/viewer/calendar", label: "Calendar", icon: CalendarDays },
];

export function MobileNav({ role, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "ADMIN" ? adminLinks : role === "VIEWER" ? viewerLinks : memberLinks;

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-900 tracking-tight">Daily Brief</p>
        </div>
        <button onClick={() => setOpen(!open)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          {open ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
        </button>
      </div>

      {/* Slide-down menu */}
      {open && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard/admin" && link.href !== "/dashboard/member" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <link.icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-gray-400")} />
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600">
                {userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <span className="text-[13px] font-medium text-gray-700">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
