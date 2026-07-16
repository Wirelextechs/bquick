"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
};

export function AppShell({
  navItems,
  pageTitle,
  pageDescription,
  userName,
  roleLabel,
  actions,
  children,
}: {
  navItems: NavItem[];
  pageTitle: string;
  pageDescription?: string;
  userName: string;
  roleLabel: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                item.active
                  ? "text-white shadow-[var(--shadow-glow-blue)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
              style={item.active ? { background: "var(--gradient-action)" } : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
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
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface/85 px-4 backdrop-blur-md sm:px-8">
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
                {pageTitle}
              </h1>
              {pageDescription && (
                <p className="hidden truncate text-sm text-text-muted sm:block">
                  {pageDescription}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
