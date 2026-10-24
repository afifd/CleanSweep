import { Suspense } from 'react';
import FunderView from '@/components/funder-view';

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }];
}

export default async function FunderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading Funder View...</div>}>
      <FunderView id={id} />
    </Suspense>
  );
}
