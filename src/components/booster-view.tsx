'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RoleSplitLayout from '@/components/RoleSplitLayout';
import { BOOSTERS, DEMO_COORDS, DEMO_REPORT_ID } from '@/lib/actors';
import { getAccountFromPrivateKey, formatAddress, generateMockTxHash } from '@/lib/web3';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ExternalLink,
  CheckCircle2,
  MapPin,
  Wallet,
  TrendingUp,
  Users,
  ArrowRight,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';

interface BoosterViewProps {
  params: Promise<{ id: string }>;
}

export default function BoosterView({ params }: BoosterViewProps) {
  const { id } = React.use(params);
  const booster = BOOSTERS[id] || BOOSTERS['1'];

  const defaultBoost = booster.defaultAmount || '2.0';
  const initialEscrow = 5.0;

  // Form states - input-able boost amount with "Fill" capability
  const [boostInput, setBoostInput] = useState('');
  const [isFilled, setIsFilled] = useState(false);
  const [currentEscrow, setCurrentEscrow] = useState<number>(initialEscrow);
  const [hasBoosted, setHasBoosted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');

  const account = getAccountFromPrivateKey(booster.privateKey);

  const handleAutoFill = () => {
    setBoostInput(defaultBoost);
    setIsFilled(true);
  };

  const handleBoostBounty = async () => {
    const amountToAdd = parseFloat(boostInput || defaultBoost);
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const hash = generateMockTxHash();
      setTxHash(hash);
      setCurrentEscrow((prev) => prev + amountToAdd);
      setHasBoosted(true);
    } catch (err) {
      console.error('Failed to boost bounty:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleSplitLayout
      coords={DEMO_COORDS}
      status="ACTIVE"
      bountyAmount={currentEscrow.toFixed(1)}
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
            <span>{formatAddress(account.address)}</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Burner Key</span>
          </div>
        </div>

        {/* Main Action Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Inspect & Boost Escrow</CardTitle>
                <p className="text-xs font-mono text-muted-foreground">Ticket #Malioboro-01</p>
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
                  alt="Spanduk Liar Target"
                  fill
                  sizes="(max-width: 768px) 50vw, 220px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center p-3 rounded-md border bg-muted/30 space-y-1">
                <span className="text-xs text-muted-foreground">Total Escrow Pool</span>
                <span className="text-2xl font-extrabold text-primary">
                  {currentEscrow.toFixed(1)} MON
                </span>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="size-3" />
                  <span>{hasBoosted ? '2 Backers' : '1 Funder'}</span>
                </div>
              </div>
            </div>

            {/* Input-able Boost Increment Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="boost-amount" className="text-xs font-semibold">
                Boost Increment Amount
              </Label>
              <div className="relative">
                <Input
                  id="boost-amount"
                  value={boostInput}
                  onChange={(e) => {
                    setBoostInput(e.target.value);
                    setIsFilled(e.target.value.trim().length > 0);
                  }}
                  placeholder="e.g. 2.0"
                  className="h-9 text-xs pr-14 font-mono font-semibold"
                  disabled={hasBoosted}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500 font-mono pointer-events-none">
                  MON
                </span>
              </div>
            </div>

            {/* Ticket Summary Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-md border">
              <div className="flex items-start gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Location</p>
                  <p className="text-muted-foreground">Jl. Malioboro No. 42</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Report ID</p>
                <p className="font-mono text-muted-foreground">{DEMO_REPORT_ID.slice(0, 10)}...</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Initial Bounty</p>
                <p className="text-muted-foreground">5.0 MON (Pak Budi)</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Boost Applied</p>
                <p className="font-bold text-amber-600">
                  +{boostInput || (isFilled ? defaultBoost : '0.0')} MON
                </p>
              </div>
            </div>

            {/* Success state info */}
            {hasBoosted && (
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  <span>Bounty Boosted by +{boostInput || defaultBoost} MON!</span>
                </div>
                <p className="text-muted-foreground">
                  Added to Monad escrow vault. Total bounty is now {currentEscrow.toFixed(1)} MON.
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
            {hasBoosted ? (
              <div className="w-full space-y-2">
                <Button className="w-full" disabled variant="outline">
                  <TrendingUp className="size-4 mr-1 text-emerald-600" />
                  Boosted Total: {currentEscrow.toFixed(1)} MON
                </Button>
                <Link
                  href="/cleaner/1"
                  className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full' })}
                >
                  Proceed to Cleaner Verification <ArrowRight className="size-3 ml-1" />
                </Link>
              </div>
            ) : (
              <div className="w-full space-y-2">
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
                  disabled={!isFilled || isLoading}
                  onClick={handleBoostBounty}
                >
                  {isLoading
                    ? 'Confirming on Monad...'
                    : isFilled
                    ? `Boost +${boostInput || defaultBoost} MON`
                    : 'Fill Amount to Boost'}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </RoleSplitLayout>
  );
}
