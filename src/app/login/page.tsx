"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Radar, Anchor } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("That email or password doesn't match our records.");
      return;
    }

    router.push(callbackUrl ?? "/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — ocean gradient identity */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden px-12 py-12 lg:flex"
        style={{ background: "var(--gradient-ocean)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[26rem] w-[26rem] rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--brand-cyan), transparent 70%)",
            animation: "drift 14s ease-in-out infinite",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-[22rem] w-[22rem] rounded-full opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--brand-red-bright), transparent 70%)",
            animation: "drift 18s ease-in-out infinite reverse",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Logo size={32} dark />
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur-sm">
            Origin → Ghana
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white">
            From origin to your doorstep,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, var(--brand-cyan), #ffffff)" }}
            >
              tracked every step.
            </span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            BQUICK Logistics moves goods from overseas partners into Ghana with
            full visibility for clients, agents, and operations from pickup to
            final delivery.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <FeaturePill icon={<Radar className="size-3.5" />} label="Live tracking" />
            <FeaturePill icon={<ShieldCheck className="size-3.5" />} label="Role-based access" />
            <FeaturePill icon={<Anchor className="size-3.5" />} label="Port to warehouse" />
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} BQUICK Logistics. All rights reserved.
        </p>

        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24 w-full opacity-[0.12]"
          viewBox="0 0 500 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 60C80 90 160 20 250 50C340 80 420 30 500 55V100H0V60Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-background px-6 py-12 lg:w-1/2">
        <div
          className="pointer-events-none absolute -right-40 top-1/3 h-80 w-80 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--brand-blue), transparent 70%)" }}
        />

        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size={28} />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="login-email" className="mb-1.5">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label htmlFor="login-password" className="mb-1.5">
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-brand-red-light px-3.5 py-2.5 text-sm text-brand-red-bright">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{
                background: "var(--gradient-action)",
                boxShadow: "var(--shadow-glow-blue)",
              }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-text-muted">
            Trouble signing in? Contact your BQUICK Logistics administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm">
      {icon}
      {label}
    </span>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
