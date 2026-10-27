import { Container, Skeleton } from '@/components/bq';

export default function LeaderboardLoading() {
  return (
    <Container className="flex flex-col gap-7 px-5 pb-[72px] pt-10" aria-busy="true">
      <span className="sr-only">Ranglijst laden</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 items-start gap-8 m:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-8">
          <Skeleton className="h-14 w-full rounded-[14px]" />
          <Skeleton className="mx-auto h-60 w-full max-w-[560px]" />
          <div className="overflow-hidden rounded-[16px] border border-line bg-card">
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex items-center gap-3.5 border-b border-line-soft px-5 py-3 last:border-b-0">
                <Skeleton className="h-5 w-7" />
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-5 grow" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-52 w-full rounded-[16px]" />
          <Skeleton className="h-60 w-full rounded-[16px]" />
        </div>
      </div>
    </Container>
  );
}
