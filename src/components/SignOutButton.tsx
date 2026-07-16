"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      aria-label="Sign out"
      title="Sign out"
      className="shrink-0 rounded-md p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
