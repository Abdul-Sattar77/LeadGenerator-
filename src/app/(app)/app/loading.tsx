import { Skeleton, StatCardSkeleton, CardSkeleton } from "@/components/ui/skeletons";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={6} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
