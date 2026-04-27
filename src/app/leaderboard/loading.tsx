import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="-mt-24 min-h-screen pb-12 pt-24">
      <div className="mx-auto max-w-340 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border/50 bg-white">
          <div className="hidden border-b border-border/50 px-4 py-3 md:block">
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="grid gap-2 p-4 md:grid-cols-[90px_minmax(0,1fr)_130px_130px] md:items-center">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
