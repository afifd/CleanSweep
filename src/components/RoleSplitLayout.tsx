'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const MapExplorer = dynamic(() => import('@/components/MapExplorer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-87.5 flex items-center justify-center bg-muted animate-pulse text-xs text-muted-foreground">
      Loading interactive map...
    </div>
  ),
});

interface RoleSplitLayoutProps {
  children: React.ReactNode;
  coords: { lat: number; lng: number };
  status?: 'NONE' | 'ACTIVE' | 'RESOLVED';
  bountyAmount?: string;
  roleBadge: string;
  title?: string;
}

export default function RoleSplitLayout({
  children,
  coords,
  status = 'ACTIVE',
  bountyAmount = '5.0',
  roleBadge,
  title = 'Spanduk Liar',
}: RoleSplitLayoutProps) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* Left/Bottom: Action Panel */}
      <div className="flex flex-col justify-between p-6 md:p-10 order-2 lg:order-1 overflow-y-auto pb-20">
        <div className="flex justify-between items-center w-full max-w-md mx-auto mb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground group-hover:opacity-90">
              <Sparkles className="size-4" />
            </div>
            <span className="font-bold tracking-tight text-lg">CleanSweep</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{roleBadge}</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">Monad Testnet</span>
          </div>
        </div>

        <div className="flex justify-center items-center flex-1">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-6">
          Civic Micro-Bounties with Instant Settlement on Monad
        </div>
      </div>

      {/* Right/Top: Map Viewport */}
      <div className="relative h-87.5 lg:h-full w-full bg-muted order-1 lg:order-2 border-b lg:border-b-0 lg:border-l">
        <MapExplorer coords={coords} status={status} bountyAmount={bountyAmount} title={title} />
      </div>
    </div>
  );
}
