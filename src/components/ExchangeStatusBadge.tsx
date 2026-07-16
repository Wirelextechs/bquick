import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Pending" },
  PROCESSING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Processing" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
  FAILED: { bg: "bg-red-50", text: "text-brand-red", dot: "bg-brand-red", label: "Failed" },
};

const STATUS_DOTS_ON_DARK: Record<string, string> = {
  PENDING: "bg-white/70",
  PROCESSING: "bg-amber-300",
  COMPLETED: "bg-emerald-300",
  FAILED: "bg-red-300",
};

export function ExchangeStatusBadge({ status, light = false }: { status: string; light?: boolean }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;

  if (light) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-white/20 bg-white/10 text-white backdrop-blur-sm"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS_ON_DARK[status] ?? "bg-white"}`} />
        {style.label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`gap-1.5 border-transparent ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </Badge>
  );
}
