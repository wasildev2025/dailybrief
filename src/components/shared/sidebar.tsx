"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  Activity,
  CalendarRange,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/actions/auth-actions";
import { useRouter } from "next/navigation";

interface SidebarProps {
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

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const links = role === "ADMIN" ? adminLinks : memberLinks;

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-gray-200/80 h-screen sticky top-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 border-b border-gray-100 px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-900 tracking-tight">Daily Brief</p>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">OAS Dev</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </p>
        )}
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard/admin" && link.href !== "/dashboard/member" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-[0_1px_3px_rgba(99,102,241,0.12)]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? link.label : undefined}
            >
              <link.icon className={cn(
                "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              {!collapsed && <span>{link.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-[11px] font-medium">Collapse</span>}
        </button>
      </div>

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-100">
        <div className={cn("flex items-center gap-2.5 mb-2", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[11px] font-bold text-gray-600 flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 truncate">{userName}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                {role.toLowerCase()}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
