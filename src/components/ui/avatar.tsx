import { cn } from "@/lib/utils";

// Deterministic gradient avatar from a name's initials.
const GRADS = [
  "from-sky-400 to-indigo-400",
  "from-violet-400 to-fuchsia-400",
  "from-emerald-400 to-teal-400",
  "from-amber-400 to-orange-400",
  "from-pink-400 to-rose-400",
  "from-cyan-400 to-blue-400",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SIZES = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-11 w-11 text-sm" };

export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  const initials =
    name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
  const grad = GRADS[hash(name) % GRADS.length];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm ring-2 ring-white",
        grad,
        SIZES[size],
        className
      )}
      title={name}
    >
      {initials}
    </span>
  );
}
