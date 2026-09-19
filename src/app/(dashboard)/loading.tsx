import { CardSkeleton } from '@/shared/ui/state-panels';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 lg:px-8 lg:py-8">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
