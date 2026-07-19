import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import { ExchangeRateCalculator } from "@/components/ExchangeRateCalculator";
import { PublicExchangeRequestForm } from "@/components/PublicExchangeRequestForm";
import {
  ArrowRight,
  MessageCircle,
  Phone,
  Radar,
  ShieldCheck,
  Anchor,
  Quote,
  Star,
  Wallet,
  UploadCloud,
  CheckCircle2,
  Clock,
  Users,
  PackageCheck,
  Lock,
} from "lucide-react";

const STATS = [
  { icon: <Users className="size-5" />, value: "500+", label: "Exchanges processed" },
  { icon: <Clock className="size-5" />, value: "< 1 hr", label: "Typical turnaround" },
  { icon: <PackageCheck className="size-5" />, value: "3+ yrs", label: "Ghana ↔ China freight" },
  { icon: <Lock className="size-5" />, value: "100%", label: "Verified MoMo settlement" },
];

const HOW_IT_WORKS = [
  {
    icon: <Wallet className="size-5" />,
    title: "Send GHS",
    body: "Pay our verified MoMo number for the amount you want exchanged.",
  },
  {
    icon: <UploadCloud className="size-5" />,
    title: "Upload proof",
    body: "Attach your payment screenshot and recipient details, takes under a minute.",
  },
  {
    icon: <CheckCircle2 className="size-5" />,
    title: "Get your RMB",
    body: "We verify and settle to your recipient, and you track it live with your code.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ama K.",
    role: "Kantamanto trader",
    quote:
      "I sent GHS in the morning and my supplier in Guangzhou confirmed the RMB same day. No account, no stress.",
  },
  {
    name: "Kwame O.",
    role: "Electronics importer",
    quote:
      "BQUICK has handled three of my containers from China to Tema so far. Tracking updates keep me calm the whole way.",
  },
  {
    name: "Linda A.",
    role: "Online reseller",
    quote:
      "The rate is clear upfront and the MoMo details are verified, so I never worry about sending to the wrong number.",
  },
];

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm">
      {icon}
      {label}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    switch (session.user.role) {
      case "ADMIN":
        redirect("/admin");
      case "AGENT":
        redirect("/agent");
      case "CLIENT":
        redirect("/client");
      default:
        redirect("/login");
    }
  }

  const [latestRate, settings] = await Promise.all([
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.exchangePaymentSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const whatsappHref = settings?.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;
  const callHref = settings?.callNumber ? `tel:${settings.callNumber.replace(/[^0-9+]/g, "")}` : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border-subtle/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <Logo size={26} />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/track"
              className="hidden text-sm font-medium text-text-secondary transition hover:text-brand-blue sm:inline-block"
            >
              Track a request
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
              style={{ background: "var(--gradient-action)" }}
            >
              Login to track your shipment
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:px-8 sm:py-28"
        style={{ background: "var(--gradient-ocean)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
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

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
            <Star className="size-3 fill-current text-brand-cyan" /> Trusted by 500+ traders and importers
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Ghana ↔ China, made{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, var(--brand-cyan), #ffffff)" }}
            >
              fast and trackable.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70">
            Exchange GHS for RMB in minutes, no account needed, or ship goods from China to
            Ghana with full visibility from pickup to delivery.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#exchange"
              className="group inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              style={{ background: "var(--gradient-action)", boxShadow: "var(--shadow-glow-blue)" }}
            >
              Request an exchange now
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              Login to track your shipment
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <FeaturePill icon={<Radar className="size-3.5" />} label="Live tracking" />
            <FeaturePill icon={<ShieldCheck className="size-3.5" />} label="Verified settlement" />
            <FeaturePill icon={<Anchor className="size-3.5" />} label="Port to warehouse" />
          </div>
        </div>

        {/* Stat strip, anchored to the bottom edge of the hero for a "floating card" feel */}
        <div className="relative z-10 mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md sm:grid-cols-4 sm:gap-4 sm:p-5">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-1 text-left">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-cyan">
                  {stat.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-white">{stat.value}</p>
                  <p className="mt-1 truncate text-[11px] text-white/60">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 pt-20 sm:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Three steps, no paperwork
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-border-subtle bg-surface p-6 shadow-[var(--shadow-card)]">
              <span className="absolute -top-3 -left-3 flex size-7 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white shadow-sm">
                {i + 1}
              </span>
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
                {step.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-primary">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exchange widget */}
      <section id="exchange" className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Fast exchange</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Request an RMB exchange
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            Send GHS, receive RMB in China, then track your request with the reference code we
            give you.
          </p>
        </div>
        {latestRate ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <ExchangeRateCalculator rate={latestRate.rate.toString()} />
              <p className="text-center text-xs text-text-muted lg:text-left">
                Already have a request?{" "}
                <Link href="/track" className="text-brand-blue hover:underline">
                  Track it here
                </Link>
                .
              </p>
            </div>
            <PublicExchangeRequestForm rate={latestRate.rate.toString()} />
          </div>
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 text-center text-sm text-text-muted shadow-[var(--shadow-card)]">
            Exchange requests are temporarily unavailable. Please check back shortly or reach us
            on WhatsApp below.
          </div>
        )}
      </section>

      {/* Shipping CTA */}
      {(whatsappHref || callHref) && (
        <section className="px-4 py-6 sm:px-8">
          <div
            className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-6 py-12 text-center shadow-[var(--shadow-elevated)] sm:px-12"
            style={{ background: "var(--gradient-navy)" }}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-25 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--brand-cyan), transparent 70%)" }}
            />
            <Anchor className="mx-auto size-8 text-brand-cyan" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Shipping goods from China to Ghana?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/65">
              Talk to our team directly and we&apos;ll walk you through pickup, freight, and
              delivery to your door.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <MessageCircle className="size-4" /> WhatsApp us
                </a>
              )}
              {callHref && (
                <a
                  href={callHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  <Phone className="size-4" /> Call us
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Testimonials</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              What people have to say
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-2xl border border-border-subtle bg-surface p-6 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-center justify-between">
                  <Quote className="size-6 text-brand-cyan" />
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-text-secondary">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-border-subtle pt-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-xs font-bold text-brand-blue">
                    {initials(t.name)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-8">
        <div
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-6 py-14 text-center"
          style={{ background: "var(--gradient-ocean)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle at 80% 30%, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <h2 className="relative text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to send your first exchange?
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-white/70">
            No sign-up. No waiting in line. Just fill the form and track it live.
          </p>
          <a
            href="#exchange"
            className="relative mt-7 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            style={{ background: "var(--gradient-action)", boxShadow: "var(--shadow-glow-blue)" }}
          >
            Request an exchange <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle px-4 py-10 text-center sm:px-8">
        <Logo size={22} />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted">
          <Link href="/track" className="hover:text-brand-blue">
            Track a request
          </Link>
          <Link href="/login" className="hover:text-brand-blue">
            Client login
          </Link>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          © {new Date().getFullYear()} BQUICK Logistics. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
