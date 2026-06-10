import { cn } from "@/lib/utils";

// Shimmering skeleton block (uses the .skeleton class from globals.css).
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-premium">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="mt-4 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}

export function CardSkeleton({ lines = 4, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-card", className)}>
      <Skeleton className="h-4 w-32" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
