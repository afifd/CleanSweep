import { Suspense } from 'react';
import BoosterView from '@/components/booster-view';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default async function BoosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading Booster View...</div>}>
      <BoosterView id={id} />
    </Suspense>
  );
}
