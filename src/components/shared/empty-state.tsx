import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-2xl bg-gray-100 p-4 mb-4">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-[14px] font-semibold text-gray-800 mb-0.5">{title}</h3>
      <p className="text-[12px] text-gray-400 max-w-sm">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
