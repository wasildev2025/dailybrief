import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { AuthSessionProvider } from "@/components/shared/session-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen bg-[#f8f9fb]">
        <Sidebar
          role={session.user.role}
          userName={session.user.name || "User"}
        />
        <main className="flex-1 overflow-auto">
          <div className="px-6 py-6 lg:px-10 lg:py-8 max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthSessionProvider>
  );
}
