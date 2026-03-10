import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { AuthSessionProvider } from "@/components/shared/session-provider";
import { MobileNav } from "@/components/shared/mobile-nav";

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
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar role={session.user.role} userName={session.user.name || "User"} />
        </div>
        <main className="flex-1 overflow-auto flex flex-col">
          {/* Mobile nav */}
          <div className="lg:hidden">
            <MobileNav role={session.user.role} userName={session.user.name || "User"} />
          </div>
          <PageHeader />
          <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </AuthSessionProvider>
  );
}
