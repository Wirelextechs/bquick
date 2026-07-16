import {
  Avatar as AvatarRoot,
  AvatarFallback,
} from "@/components/ui/avatar";

const PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const palette = PALETTE[hashName(name) % PALETTE.length];

  return (
    <AvatarRoot style={{ width: size, height: size }} className="after:hidden">
      <AvatarFallback className={`text-xs font-semibold ${palette}`}>
        {initials || "?"}
      </AvatarFallback>
    </AvatarRoot>
  );
}
