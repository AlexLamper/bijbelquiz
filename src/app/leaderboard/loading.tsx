import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen">
      <div className="container px-4 py-8 md:py-12 mx-auto max-w-5xl">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-5 w-24 mb-6" />
        
        {/* Hero skeleton */}
        <div className="text-center mb-8 space-y-4">
          <Skeleton className="h-8 w-32 mx-auto rounded-full" />
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto max-w-full" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-4 md:p-6">
              <Skeleton className="h-6 w-6 mx-auto mb-2 rounded-full" />
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="rounded-lg border border-border/50 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full md:w-48" />
            <Skeleton className="h-10 w-full md:w-44" />
          </div>
        </div>

        {/* Podium skeleton */}
        <div className="flex items-end justify-center gap-4 md:gap-6 h-[280px] md:h-[320px] mb-8">
          <div className="flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full mb-2" />
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-16 w-24 mt-2 rounded-t-lg" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-20 w-20 rounded-full mb-2" />
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-24 w-28 mt-2 rounded-t-lg" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-14 w-14 rounded-full mb-2" />
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-12 w-24 mt-2 rounded-t-lg" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-20 md:hidden" />
                </div>
                <Skeleton className="h-5 w-12 hidden md:block" />
                <Skeleton className="h-5 w-12 hidden lg:block" />
                <Skeleton className="h-5 w-10 hidden sm:block" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
