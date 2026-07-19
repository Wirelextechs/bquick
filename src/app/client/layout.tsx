import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { ClientNav } from "@/components/ClientNav";
import { PageHeaderProvider } from "@/components/PageHeaderContext";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") redirect("/login");

  return (
    <PageHeaderProvider>
      <AppShell navItems={ClientNav()} userName={session.user.name ?? ""} roleLabel="Client">
        {children}
      </AppShell>
    </PageHeaderProvider>
  );
}
