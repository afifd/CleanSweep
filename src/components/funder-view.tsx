'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RoleSplitLayout from '@/components/RoleSplitLayout';
import { FUNDERS, DEMO_COORDS, DEMO_REPORT_ID } from '@/lib/actors';
import { getAccountFromPrivateKey, formatAddress, generateMockTxHash } from '@/lib/web3';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, MapPin, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface FunderViewProps {
  id: string;
}

export default function FunderView({ id }: FunderViewProps) {
  const funder = FUNDERS[id] || FUNDERS['1'];

  const [status, setStatus] = useState<'NONE' | 'ACTIVE' | 'RESOLVED'>('NONE');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');

  const account = getAccountFromPrivateKey(funder.privateKey);
  const bountyAmount = funder.defaultAmount || '5.0';
  const coords = funder.coords || DEMO_COORDS;
  const locationLabel = funder.locationLabel || 'Jl. Malioboro No. 42';
  const imageSrc = funder.image || '/images/banner-before.jpg';

  const handleLockBounty = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 850));
      const hash = generateMockTxHash();
      setTxHash(hash);
      setStatus('ACTIVE');
    } catch (err) {
      console.error('Failed to lock bounty:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleSplitLayout
      coords={coords}
      status={status}
      bountyAmount={bountyAmount}
      roleBadge="Funder Persona"
      title={`Spanduk Liar - ${locationLabel}`}
    >
      <div className="space-y-4">
        {/* Persona Header */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Persona</p>
              <h2 className="text-base font-bold">{funder.name}</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              Funder #{id}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Wallet className="size-3.5 text-primary" />
            <span>{formatAddress(account.address)}</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Burner Key</span>
          </div>
        </div>

        {/* Main Action Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Report & Lock Escrow Bounty</CardTitle>
              <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[11px]">
                {status === 'ACTIVE' ? 'ESCROW LOCKED' : 'AWAITING LOCK'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Deposit micro-bounty into Monad escrow contract for community cleaning.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            {/* Evidence Image */}
            <div className="relative w-full h-44 border rounded-md overflow-hidden bg-muted">
              <Image
                src={imageSrc}
                alt="Evidence Before"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium">
                Initial Photo Evidence
              </div>
            </div>

            {/* Target details */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-md border">
              <div className="flex items-start gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Location</p>
                  <p className="text-muted-foreground">{locationLabel}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Coordinates</p>
                <p className="font-mono text-muted-foreground">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Bounty Lock</p>
                <p className="font-bold text-primary">{bountyAmount} MON</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Ticket ID</p>
                <p className="font-mono text-muted-foreground">{DEMO_REPORT_ID.slice(0, 10)}...</p>
              </div>
            </div>

            {/* Success state info */}
            {status === 'ACTIVE' && (
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  <span>Escrow Bounty Locked on Monad!</span>
                </div>
                <p className="text-muted-foreground">
                  Transaction confirmed in sub-second block time. The bounty is now live on the public map.
                </p>
                {txHash && (
                  <div className="flex items-center justify-between font-mono text-[11px] bg-background/80 p-1.5 rounded border">
                    <span className="truncate max-w-55">Tx: {txHash}</span>
                    <a
                      href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-0.5 hover:underline"
                    >
                      Explorer <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0">
            {status === 'ACTIVE' ? (
              <div className="w-full space-y-2">
                <Button className="w-full" disabled variant="outline">
                  <ShieldCheck className="size-4 mr-1 text-emerald-600" />
                  Bounty Active ({bountyAmount} MON)
                </Button>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/booster/1"
                    className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'w-full' })}
                  >
                    View as Booster <ArrowRight className="size-3 ml-1" />
                  </Link>
                  <Link
                    href="/cleaner/1"
                    className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full' })}
                  >
                    View as Cleaner <ArrowRight className="size-3 ml-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <Button
                className="w-full font-semibold"
                size="lg"
                disabled={isLoading}
                onClick={handleLockBounty}
              >
                {isLoading ? 'Locking on Monad Testnet...' : `Lock ${bountyAmount} MON Bounty`}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </RoleSplitLayout>
  );
}
