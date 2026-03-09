"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getMyUpdates } from "@/actions/update-actions";
import { formatDateForDisplay } from "@/lib/date-utils";
import { History, Loader2 } from "lucide-react";

interface UpdateHistoryProps {
  onSelectDate: (date: Date) => void;
}

export function UpdateHistory({ onSelectDate }: UpdateHistoryProps) {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getMyUpdates(10);
      setUpdates(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          Recent Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {updates.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={History}
              title="No updates yet"
              description="Your submitted updates will appear here"
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {updates.map((update) => (
              <button
                key={update.id}
                onClick={() => onSelectDate(new Date(update.date))}
                className="w-full text-left px-6 py-3 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-gray-800">
                    {formatDateForDisplay(new Date(update.date))}
                  </span>
                  <StatusBadge status={update.status} />
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {update.tasks.length} task{update.tasks.length !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
