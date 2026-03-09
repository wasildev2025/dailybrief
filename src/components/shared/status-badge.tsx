import { cn } from "@/lib/utils";

const statusConfig = {
  DRAFT: { label: "Draft", className: "bg-amber-50 text-amber-700 border-amber-200" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-200" },
  REVIEWED: { label: "Reviewed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  NOT_SUBMITTED: { label: "Pending", className: "bg-gray-50 text-gray-500 border-gray-200" },
};

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", config.className)}>
      {config.label}
    </span>
  );
}
