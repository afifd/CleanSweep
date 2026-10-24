import { Suspense } from 'react';
import CleanerView from '@/components/cleaner-view';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function CleanerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
          Loading Cleaner View...
        </div>
      }
    >
      <CleanerView params={params} />
    </Suspense>
  );
}
