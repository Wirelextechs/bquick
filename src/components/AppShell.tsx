"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";
import { usePageHeaderContext } from "./PageHeaderContext";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

// Root-level nav items ("/admin", "/agent", "/client") should only be
// active on an exact match — otherwise every nested route under them
// (e.g. "/admin/clients") would also light up "Shipments".
function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  const rootHrefs = ["/admin", "/agent", "/client"];
  if (rootHrefs.includes(href)) return false;
  return pathname.startsWith(href + "/");
}

export function AppShell({
  navItems,
  userName,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { header } = usePageHeaderContext();

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-navy-deep/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col overflow-hidden transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : ""
        }`}
        style={{ background: "var(--gradient-navy)" }}
      >
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--brand-cyan), transparent 70%)" }}
        />

        <div className="relative flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Logo size={26} dark />
          </Link>
        </div>

        <nav className="relative flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "text-white shadow-[var(--shadow-glow-blue)]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
                style={active ? { background: "var(--gradient-action)" } : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: "var(--gradient-action)" }}
            >
              {initials || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-white/50">{roleLabel}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-subtle bg-surface/85 px-4 py-2 backdrop-blur-md sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="shrink-0 rounded-md p-1.5 text-text-secondary hover:bg-surface-sunken lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-text-primary">
                {header?.title ?? ""}
              </h1>
              {header?.description && (
                <p className="hidden truncate text-sm text-text-muted sm:block">
                  {header.description}
                </p>
              )}
            </div>
          </div>
          {header?.actions && (
            <div className="flex w-full shrink-0 flex-wrap items-center gap-3 sm:w-auto">
              {header.actions}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
