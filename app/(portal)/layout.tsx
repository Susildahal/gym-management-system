import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/topnav";
import { getUnreadCount } from "@/lib/actions/notifications";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.requiresPasswordChange) {
    redirect("/change-password");
  }

  const unreadCount = await getUnreadCount();

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav name={session.user.name ?? session.user.username} role={session.user.role} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
