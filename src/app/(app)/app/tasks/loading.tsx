import { Skeleton } from "@/components/ui/skeletons";

export default function TasksLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      <div className="rounded-2xl border border-border bg-card p-2 shadow-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-3">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
