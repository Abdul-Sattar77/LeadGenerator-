import { Skeleton, StatCardSkeleton } from "@/components/ui/skeletons";

export default function PipelineLoading() {
  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, c) => (
          <div key={c} className="w-[290px] shrink-0">
            <Skeleton className="mb-2.5 h-5 w-40" />
            <div className="space-y-2.5 rounded-2xl border border-black/[0.06] bg-white/40 p-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
