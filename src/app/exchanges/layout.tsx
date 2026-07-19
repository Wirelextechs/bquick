import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { ClientNav } from "@/components/ClientNav";
import { PageHeaderProvider } from "@/components/PageHeaderContext";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  CLIENT: "Client",
};

// Reachable by ADMIN (processing) or CLIENT (their own request) only.
export default async function ExchangesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const navItems = role === "ADMIN" ? AdminNav() : ClientNav();

  return (
    <PageHeaderProvider>
      <AppShell navItems={navItems} userName={session.user.name ?? ""} roleLabel={ROLE_LABELS[role] ?? role}>
        {children}
      </AppShell>
    </PageHeaderProvider>
  );
}
