import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { AgentNav } from "@/components/AgentNav";
import { PageHeaderProvider } from "@/components/PageHeaderContext";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENT") redirect("/login");

  return (
    <PageHeaderProvider>
      <AppShell navItems={AgentNav()} userName={session.user.name ?? ""} roleLabel="Agent">
        {children}
      </AppShell>
    </PageHeaderProvider>
  );
}
