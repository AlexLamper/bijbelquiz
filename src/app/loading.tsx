import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <LoadingSpinner size="xl" />
    </div>
  );
}
