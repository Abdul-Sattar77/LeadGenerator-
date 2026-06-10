import { Skeleton } from "@/components/ui/skeletons";

export default function LeadsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-56 rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/60 py-3 last:border-0">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-28 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
