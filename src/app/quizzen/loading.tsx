import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function QuizzesLoading() {
  return (
    <div className="container px-4 py-8 mx-auto flex h-[50vh] w-full items-center justify-center">
      <LoadingSpinner size="xl" />
    </div>
  );
}
