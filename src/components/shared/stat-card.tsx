import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({ title, value, icon: Icon, iconColor = "text-indigo-600", iconBg = "bg-indigo-50" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-[28px] font-bold text-gray-900 mt-1 leading-none">{value}</p>
        </div>
        <div className={cn("rounded-lg p-2", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
    </div>
  );
}
