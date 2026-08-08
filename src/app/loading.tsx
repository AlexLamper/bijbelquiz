import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper">
      <LoadingSpinner size="xl" />
    </div>
  );
}
