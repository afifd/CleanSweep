import { Suspense } from 'react';
import BoosterView from '@/components/booster-view';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function BoosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
          Loading Booster View...
        </div>
      }
    >
      <BoosterView params={params} />
    </Suspense>
  );
}
