export const STATUS_ORDER = [
  "PENDING",
  "IN_TRANSIT",
  "AT_PORT",
  "AT_WAREHOUSE",
  "PICKED_UP",
] as const;

export function nextStatus(current: string): string | null {
  const idx = STATUS_ORDER.indexOf(current as (typeof STATUS_ORDER)[number]);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}
