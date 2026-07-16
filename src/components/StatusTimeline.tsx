import { STATUS_ORDER } from "@/lib/statusFlow";

const STEP_LABELS: Record<string, string> = {
  PENDING: "Order placed",
  IN_TRANSIT: "In transit",
  AT_PORT: "At Ghana port",
  AT_WAREHOUSE: "At warehouse",
  PICKED_UP: "Picked up",
};

export function StatusTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);

  return (
    <div className="flex items-center">
      {STATUS_ORDER.map((step, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === STATUS_ORDER.length - 1;
        return (
          <div key={step} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                  done ? "border-transparent" : "border-border-strong bg-surface"
                } ${isCurrent ? "scale-110 ring-4 ring-brand-cyan/25" : ""}`}
                style={done ? { background: "var(--gradient-action)" } : undefined}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`mt-1.5 w-11 text-center text-[9px] leading-tight sm:w-16 sm:text-[10px] ${
                  done ? "font-medium text-text-primary" : "text-text-muted"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className="mx-1 mb-4 h-0.5 flex-1 rounded bg-border-subtle"
                style={
                  i < currentIndex ? { background: "var(--gradient-action)" } : undefined
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
