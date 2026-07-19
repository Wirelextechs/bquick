import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { AgentNav } from "@/components/AgentNav";
import { ClientNav } from "@/components/ClientNav";
import { PageHeaderProvider } from "@/components/PageHeaderContext";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  AGENT: "Agent",
  CLIENT: "Client",
};

// Shared by every role (a shipment detail page can be reached from the
// admin, agent, or client shipment lists), so the nav shown depends on
// who's viewing it rather than a single fixed role like the other layouts.
export default async function OrdersLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const navItems = role === "ADMIN" ? AdminNav() : role === "AGENT" ? AgentNav() : ClientNav();

  return (
    <PageHeaderProvider>
      <AppShell navItems={navItems} userName={session.user.name ?? ""} roleLabel={ROLE_LABELS[role] ?? role}>
        {children}
      </AppShell>
    </PageHeaderProvider>
  );
}
