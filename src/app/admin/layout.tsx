import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { PageHeaderProvider } from "@/components/PageHeaderContext";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <PageHeaderProvider>
      <AppShell navItems={AdminNav()} userName={session.user.name ?? ""} roleLabel="Administrator">
        {children}
      </AppShell>
    </PageHeaderProvider>
  );
}
