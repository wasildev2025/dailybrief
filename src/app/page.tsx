"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Daily Brief</h1>
          <p className="text-xs text-gray-400 mt-0.5">OAS Dev Team</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
      </div>
    </div>
  );
}
