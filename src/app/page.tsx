'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Sparkles, MapPin, Coins, ShieldCheck, Flame, Layers } from 'lucide-react';
import { FUNDERS, DEMO_COORDS } from '@/lib/actors';

const MapExplorer = dynamic(() => import('@/components/MapExplorer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-muted animate-pulse text-xs text-muted-foreground">
      Loading civic bounty map...
    </div>
  ),
});

interface BountyTicket {
  id: string;
  ticketNo: string;
  title: string;
  location: string;
  coords: { lat: number; lng: number };
  bounty: string;
  funderName: string;
  status: 'ACTIVE' | 'RESOLVED' | 'NONE';
  image: string;
  funderHref: string;
  boosterHref?: string;
  cleanerHref?: string;
}

const BOUNTY_TICKETS: BountyTicket[] = [
  {
    id: '1',
    ticketNo: '#Malioboro-01',
    title: 'Spanduk Liar Tanpa Izin',
    location: 'Jl. Malioboro No. 42',
    coords: DEMO_COORDS,
    bounty: '5.0',
    funderName: FUNDERS['1'].name,
    status: 'ACTIVE',
    image: '/images/banner-before.jpg',
    funderHref: '/funder/1',
    boosterHref: '/booster/1',
    cleanerHref: '/cleaner/1',
  },
  {
    id: '2',
    ticketNo: '#Tugu-02',
    title: 'Tumpukan Sampah Liar',
    location: 'Simpang Tugu Yogyakarta',
    coords: FUNDERS['2'].coords || { lat: -7.7829, lng: 110.3671 },
    bounty: '3.0',
    funderName: FUNDERS['2'].name,
    status: 'ACTIVE',
    image: '/images/trash1.webp',
    funderHref: '/funder/2',
    boosterHref: '/booster/1',
    cleanerHref: '/cleaner/1',
  },
  {
    id: '3',
    ticketNo: '#Kraton-03',
    title: 'Spanduk Ilegal Pedestrian',
    location: 'Kawasan Alun-Alun Utara',
    coords: { lat: -7.8053, lng: 110.3644 },
    bounty: '4.5',
    funderName: 'Warga Kraton',
    status: 'RESOLVED',
    image: '/images/banner-after.jpg',
    funderHref: '/funder/1',
    cleanerHref: '/cleaner/1',
  },
];

export default function PublicFeedPage() {
  const [selectedTicket, setSelectedTicket] = useState<BountyTicket>(BOUNTY_TICKETS[0]);

  const mapMarkers = BOUNTY_TICKETS.map((t) => ({
    id: t.id,
    title: `${t.ticketNo} ${t.title}`,
    coords: t.coords,
    status: t.status,
    bountyAmount: t.bounty,
    roleHref: t.boosterHref || t.funderHref,
  }));

  const totalMonLocked = BOUNTY_TICKETS.reduce(
    (acc, t) => acc + (t.status === 'ACTIVE' ? parseFloat(t.bounty) : 0),
    0
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">CleanSweep</h1>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                Civic Micro-Bounties
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Decentralized public cleanup escrow powered by Monad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden md:flex items-center gap-3 border rounded-full px-3 py-1 bg-muted/40 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <Coins className="size-3 text-primary" />
              <span>Escrow Pool: <strong>{totalMonLocked.toFixed(1)} MON</strong></span>
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Monad Testnet</span>
            </span>
          </div>

          <Link
            href="/funder/1"
            className={buttonVariants({ size: 'sm', variant: 'default', className: 'text-xs' })}
          >
            + Report Bounty
          </Link>
        </div>
      </header>

      {/* Main Content: Split Feed & Full Map */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-60px)] pb-16">
        {/* Left Column: Public Feed List (5 Cols) */}
        <section className="lg:col-span-5 p-4 md:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight">Live Bounty Feed</h2>
              <p className="text-xs text-muted-foreground">Select a report to focus on map or take action</p>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {BOUNTY_TICKETS.length} Reports
            </Badge>
          </div>

          {/* Ticket Cards */}
          <div className="space-y-3">
            {BOUNTY_TICKETS.map((ticket) => {
              const isSelected = selectedTicket.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`cursor-pointer rounded-lg border transition-all p-3.5 space-y-3 ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary bg-primary/[0.02] shadow-sm'
                      : 'hover:border-foreground/30 bg-card'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative size-20 rounded-md overflow-hidden bg-muted shrink-0 border">
                      <Image
                        src={ticket.image}
                        alt={ticket.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-muted-foreground">
                          {ticket.ticketNo}
                        </span>
                        <Badge
                          variant={ticket.status === 'RESOLVED' ? 'outline' : 'default'}
                          className={`text-[10px] ${
                            ticket.status === 'RESOLVED'
                              ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
                              : ''
                          }`}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm truncate">{ticket.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{ticket.location}</span>
                      </div>
                      <div className="text-xs">
                        Bounty: <span className="font-bold text-primary">{ticket.bounty} MON</span>
                      </div>
                    </div>
                  </div>

                  {/* Persona quick links */}
                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground truncate">
                      By {ticket.funderName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ticket.boosterHref && (
                        <Link
                          href={ticket.boosterHref}
                          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-7 text-[11px] px-2.5' })}
                        >
                          <Flame className="size-3 mr-1 text-amber-500" /> Boost
                        </Link>
                      )}
                      {ticket.cleanerHref && (
                        <Link
                          href={ticket.cleanerHref}
                          className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'h-7 text-[11px] px-2.5' })}
                        >
                          <ShieldCheck className="size-3 mr-1 text-emerald-600" /> Clean
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Architecture Monad Hackathon Highlights */}
          <div className="rounded-lg border bg-muted/40 p-4 text-xs space-y-2 mt-4">
            <div className="flex items-center gap-1.5 font-bold">
              <Layers className="size-4 text-primary" />
              <span>Why Monad for Civic Micro-Bounties?</span>
            </div>
            <p className="text-muted-foreground">
              Sub-second block finality enables instant lock & claim settlement with zero gas anxiety for everyday citizens, merchant associations, and cleaners.
            </p>
          </div>
        </section>

        {/* Right Column: Full-Screen / Interactive Map (7 Cols) */}
        <section className="lg:col-span-7 h-[450px] lg:h-full relative min-h-[450px]">
          <MapExplorer
            coords={selectedTicket.coords}
            status={selectedTicket.status}
            bountyAmount={selectedTicket.bounty}
            title={`${selectedTicket.ticketNo} - ${selectedTicket.location}`}
            markers={mapMarkers}
            zoom={15}
          />
        </section>
      </main>
    </div>
  );
}
