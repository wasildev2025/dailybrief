"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { notifyPendingSubmissions } from "@/actions/notification-actions";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";

export function SendRemindersButton() {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await notifyPendingSubmissions();
      if (result.sent === 0) {
        toast.info("All members have submitted their updates");
      } else {
        toast.success(`Reminders sent to ${result.sent} member${result.sent !== 1 ? "s" : ""}: ${result.members.join(", ")}`);
      }
    } catch {
      toast.error("Failed to send reminders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm hover:bg-white/25 disabled:opacity-50 transition-colors text-white text-[12px] font-medium rounded-lg px-3.5 py-2"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
      Send Reminders
    </button>
  );
}
