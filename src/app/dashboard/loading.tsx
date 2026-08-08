import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center pt-10 bg-paper">
      <LoadingSpinner size="xl" />
    </div>
  );
}
