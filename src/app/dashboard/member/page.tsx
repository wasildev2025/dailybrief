"use client";

import { useState } from "react";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { TaskForm } from "@/components/member/task-form";
import { AttendanceForm } from "@/components/member/attendance-form";
import { UpdateHistory } from "@/components/member/update-history";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { formatDateForDisplay } from "@/lib/date-utils";

export default function MemberDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            My Daily Updates
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {formatDateForDisplay(selectedDate)}
          </p>
        </div>
        <DatePickerField
          date={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-7 space-y-5">
          <TaskForm
            selectedDate={selectedDate}
            userId={session?.user?.id || ""}
          />
        </div>

        {/* Right Column - Attendance + History */}
        <div className="lg:col-span-5 space-y-5">
          <AttendanceForm selectedDate={selectedDate} />
          <UpdateHistory onSelectDate={setSelectedDate} />
        </div>
      </div>
    </div>
  );
}
