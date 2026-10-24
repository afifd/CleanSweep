'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RoleSplitLayout from '@/components/RoleSplitLayout';
import { BOOSTERS, DEMO_COORDS } from '@/lib/actors';
import { getAccountFromPrivateKey, formatAddress } from '@/lib/web3';
import { useSearchParams } from 'next/navigation';
import { useBounty } from '@/lib/use-bounty';
import { fmt } from '@/lib/format';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, TrendingUp, Wallet, ArrowRight, Wand2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface BoosterViewProps {
  params: Promise<{ id: string }>;
}

export default function BoosterView({ params }: BoosterViewProps) {
  const { id } = React.use(params);
  const booster = BOOSTERS[id] || BOOSTERS['1'];

  const defaultBoost = booster.defaultAmount || '2.0';
  const searchParams = useSearchParams();
  const { bounty, loading, error: loadError, refresh } = useBounty(searchParams.get('bounty'));

  // Form states - input-able boost amount with "Fill" capability
  const [boostInput, setBoostInput] = useState('');
  const [isFilled, setIsFilled] = useState(false);
  const [boostedPool, setBoostedPool] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const canBoost = bounty?.status === 'ACTIVE';
  const currentEscrow = boostedPool ?? Number(bounty?.totalPool ?? 0);
  const [hasBoosted, setHasBoosted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');

  const account = getAccountFromPrivateKey(booster.privateKey);
  const displayAddress =
    booster.address && booster.address !== '0x0000000000000000000000000000000000000000'
      ? booster.address
      : account.address;

  const handleAutoFill = () => {
    setBoostInput(defaultBoost);
    setIsFilled(true);
  };

  const handleBoostBounty = async () => {
    const amountToAdd = parseFloat(boostInput || defaultBoost);
    if (isNaN(amountToAdd) || amountToAdd <= 0 || isLoading || !bounty) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/escrow/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: String(amountToAdd), bountyId: bounty.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Boost failed');
      setTxHash(data.txHash);
      setBoostedPool(Number(data.newPool));
      setHasBoosted(true);
      void refresh();
    } catch (err) {
      console.error('Failed to boost bounty:', err);
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleSplitLayout
      coords={DEMO_COORDS}
      status="ACTIVE"
      bountyAmount={fmt(currentEscrow)}
      roleBadge="Booster Persona"
      title="Spanduk Liar - #Malioboro-01"
    >
      <div className="space-y-4">
        {/* Persona Header (Not changeable) */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Persona</p>
              <h2 className="text-base font-bold">{booster.name}</h2>
            </div>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-200">
              Community Booster
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Wallet className="size-3.5 text-primary" />
            <span>{formatAddress(displayAddress)}</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Burner Key</span>
          </div>
        </div>

        {/* Main Action Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Inspect & Boost Escrow</CardTitle>
                <p className="text-xs font-mono text-muted-foreground">{loading ? 'Loading bounty…' : bounty ? `Bounty #${bounty.id} (${bounty.status})` : 'No bounty found'}</p>
              </div>
              <Badge
                variant={hasBoosted ? 'default' : 'secondary'}
                className="text-[11px]"
              >
                {hasBoosted ? 'BOOSTED' : 'ACTIVE POOL'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Add funds to an existing micro-bounty to increase cleanup urgency.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            {/* Target preview & current escrow counter */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="relative h-28 border rounded-md overflow-hidden bg-muted">
                <Image
                  src="/images/banner-before.jpg"
                  alt="Target Violation"
                  fill
                  sizes="(max-width: 768px) 100vw, 220px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center space-y-1 bg-amber-500/5 p-3 rounded-md border border-amber-500/20">
                <span className="text-[11px] text-muted-foreground">Current Escrow Pool</span>
                <span className="text-2xl font-black font-mono text-amber-600 tracking-tight">
                  {fmt(currentEscrow)} MON
                </span>
                <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="size-3" /> Community Pledged
                </span>
              </div>
            </div>

            {/* Input: Boost amount with "Fill" capability */}
            <div className="space-y-1.5">
              <Label htmlFor="boost-amount" className="text-xs font-semibold">
                Additional Pledge Amount (MON)
              </Label>
              <div className="relative">
                <Input
                  id="boost-amount"
                  type="number"
                  step="0.5"
                  placeholder="e.g. 2.0"
                  value={boostInput}
                  onChange={(e) => {
                    setBoostInput(e.target.value);
                    if (e.target.value) setIsFilled(true);
                  }}
                  disabled={hasBoosted}
                  className="text-xs h-9 pr-14 font-mono bg-background"
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                  MON
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Boosted funds are locked directly in BountyVault contract on Monad Testnet.
              </p>
            </div>

            {(errorMessage || loadError || (!loading && !bounty)) && (
              <p className="text-xs text-destructive font-medium break-words">
                {errorMessage || loadError || 'No active bounty. Create one as Funder first.'}
              </p>
            )}

            {/* Boost confirmation badge */}
            {hasBoosted && (
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  <span>Escrow Boosted by +{boostInput || defaultBoost} MON on Monad</span>
                </div>
                {txHash && (
                  <div className="flex items-center justify-between font-mono text-[11px] bg-background/80 p-1.5 rounded border">
                    <span className="truncate max-w-55">Tx: {txHash}</span>
                    <a
                      href={`https://testnet.monadscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-0.5 hover:underline"
                    >
                      Monadscan <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0">
            {hasBoosted ? (
              <div className="w-full space-y-2">
                <Button className="w-full" disabled variant="outline">
                  <CheckCircle2 className="size-4 mr-1 text-emerald-600" />
                  Boost Added to Escrow Vault
                </Button>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/"
                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-full' })}
                  >
                    View on Feed
                  </Link>
                  <Link
                    href={`/cleaner/1?bounty=${bounty?.id ?? ''}`}
                    className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full' })}
                  >
                    Switch to Cleaner <ArrowRight className="size-3 ml-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-2">
                {/* High-visibility Fill button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAutoFill}
                  className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-sm transition-all"
                >
                  <Wand2 className="size-3.5 mr-1.5 fill-white text-white" /> Fill
                </Button>

                <Button
                  className="w-full font-semibold"
                  size="lg"
                  disabled={!isFilled || isLoading || !canBoost}
                  onClick={handleBoostBounty}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Depositing Boost to BountyVault...
                    </span>
                  ) : isFilled ? (
                    `Boost Bounty (+${boostInput || defaultBoost} MON)`
                  ) : (
                    'Fill Amount to Boost'
                  )}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </RoleSplitLayout>
  );
}
