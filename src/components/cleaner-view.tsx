'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RoleSplitLayout from '@/components/RoleSplitLayout';
import { CLEANERS, DEMO_COORDS } from '@/lib/actors';
import { getAccountFromPrivateKey, formatAddress } from '@/lib/web3';
import { useSearchParams } from 'next/navigation';
import { useBounty } from '@/lib/use-bounty';
import { fmt } from '@/lib/format';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  ArrowRight,
  Sparkles,
  Navigation,
  Wand2,
  Image as ImageIcon,
  Loader2,
  Award,
} from 'lucide-react';
import Link from 'next/link';

interface CleanerViewProps {
  params: Promise<{ id: string }>;
}

export default function CleanerView({ params }: CleanerViewProps) {
  const { id } = React.use(params);
  const cleaner = CLEANERS[id] || CLEANERS['1'];

  // Form states - initially unfilled, populated on "Fill"
  const [isFilled, setIsFilled] = useState(false);
  const searchParams = useSearchParams();
  const { bounty, loading, error: loadError, refresh } = useBounty(searchParams.get('bounty'));
  const [claimed, setClaimed] = useState(false);
  const [claimResult, setClaimResult] = useState<{ netPayout: string; fee: string; before: string | null; after: string | null } | null>(null);
  const status: 'ACTIVE' | 'RESOLVED' = claimed || bounty?.status === 'CLAIMED' ? 'RESOLVED' : 'ACTIVE';
  const canClaim = bounty?.status === 'ACTIVE';
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [sbtMinted, setSbtMinted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const account = getAccountFromPrivateKey(cleaner.privateKey);
  const [cleanerAddress, setCleanerAddress] = useState<string>(
    cleaner.address && cleaner.address !== '0x0000000000000000000000000000000000000000'
      ? cleaner.address
      : account.address
  );

  const funderAmount = Number(bounty?.creatorAmount ?? 0);
  const boosterAmount = Number(bounty?.boostAmount ?? 0);
  const totalBounty = Number(bounty?.totalPool ?? 0);

  const handleAutoFill = () => {
    setIsFilled(true);
    setErrorMessage('');
  };

  const handleClaimBounty = async () => {
    if (!isFilled || isLoading || !bounty) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/settle-bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerAddress, bountyId: bounty.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Settlement failed');
      setTxHash(data.txHash);
      setSbtMinted(Boolean(data.sbtMinted));
      setClaimResult({ netPayout: data.netPayout, fee: data.fee, before: data.balanceBefore, after: data.balanceAfter });
      if (data.cleanerAddress) setCleanerAddress(data.cleanerAddress);
      setClaimed(true);
      void refresh();
    } catch (err: unknown) {
      console.error('Failed to claim bounty on-chain:', err);
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleSplitLayout
      coords={DEMO_COORDS}
      status={status}
      bountyAmount={fmt(totalBounty)}
      roleBadge="Cleaner Persona"
      title="Spanduk Liar - Cleaned & Claimed"
    >
      <div className="space-y-4">
        {/* Persona Header (Not changeable) */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Persona</p>
              <h2 className="text-base font-bold">{cleaner.name}</h2>
            </div>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200">
              Cleaner / Verifier
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Wallet className="size-3.5 text-primary" />
            <span>{formatAddress(cleanerAddress)}</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Burner Key</span>
          </div>
        </div>

        {/* Main Action Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Submit Proof & Claim Escrow</CardTitle>
                <p className="text-xs font-mono text-muted-foreground">{loading ? 'Loading bounty…' : bounty ? `Bounty #${bounty.id} (${bounty.status})` : 'No bounty found'}</p>
              </div>
              <Badge
                variant={status === 'RESOLVED' ? 'default' : isFilled ? 'secondary' : 'outline'}
                className={status === 'RESOLVED' ? 'bg-emerald-600 text-white' : ''}
              >
                {status === 'RESOLVED'
                  ? 'RESOLVED & SETTLED'
                  : isFilled
                  ? 'VERIFIED PROOF'
                  : 'AWAITING PROOF'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Instant settlement on Monad upon GPS verification and cleanup proof.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            {/* Proof Image: Placeholder vs Filled */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cleanup Proof Photo</Label>
              {isFilled ? (
                <div className="relative w-full h-44 border rounded-md overflow-hidden bg-muted">
                  <Image
                    src="/images/banner-after.jpg"
                    alt="Cleanup Proof After"
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-2 left-2 bg-emerald-700/80 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Cleanup Proof (After) Attached
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md bg-muted/20 text-muted-foreground p-3 text-center">
                  <ImageIcon className="size-6 mb-1 text-muted-foreground/60" />
                  <span className="text-xs font-medium">No cleanup proof attached</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    Click &quot;Fill&quot; below to attach after-photo and GPS proof
                  </span>
                </div>
              )}
            </div>

            {/* Verification Badges & Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border text-xs">
                <div className="flex items-center gap-2">
                  <Navigation className="size-3.5 text-emerald-600" />
                  <span className="font-medium">Proximity Verification:</span>
                </div>
                {isFilled ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-300 font-mono text-[11px]">
                    GPS Diff: 0m (Passed)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] text-muted-foreground font-mono">
                    Awaiting GPS Check
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-md border">
                <div>
                  <p className="font-semibold text-foreground">Backend ECDSA</p>
                  <p className={isFilled ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                    {isFilled ? 'Valid Signature' : 'Pending Proof'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Escrow Pool</p>
                  <p className="font-mono font-medium">{fmt(totalBounty)} MON</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Funder Pledge</p>
                  <p className="font-mono text-muted-foreground">{fmt(funderAmount)} MON</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Booster Pledge</p>
                  <p className="font-mono text-amber-600 font-medium">+{fmt(boosterAmount)} MON</p>
                </div>
              </div>
            </div>

            {/* Settlement confirmation with real on-chain transaction hashes */}
            {status === 'RESOLVED' && (
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  <Sparkles className="size-4 text-emerald-600" />
                  <span>Settlement Complete! {fmt(claimResult?.netPayout ?? totalBounty)} MON Received</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  The BountyVault smart contract released the escrow ({fmt(totalBounty)} MON pool, {fmt(claimResult?.fee ?? 0)} MON platform fee) directly to cleaner address{' '}
                  <span className="font-mono font-medium text-foreground">{formatAddress(cleanerAddress)}</span> on Monad Testnet.{claimResult && claimResult.before && claimResult.after && <> Balance: {fmt(claimResult.before)} → {fmt(claimResult.after)} MON (after gas).</>}
                </p>

                <div className="space-y-2">
                  {txHash && (
                    <div className="flex items-center justify-between font-mono text-[11px] bg-background/90 p-2 rounded-md border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[10px] font-sans bg-emerald-500/10 text-emerald-700 border-emerald-200 shrink-0">
                          BountyVault Claim Tx
                        </Badge>
                        <span className="truncate max-w-40 sm:max-w-55 text-muted-foreground">{txHash}</span>
                      </div>
                      <a
                        href={`https://testnet.monadscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-1 font-sans text-xs hover:underline ml-2 shrink-0 font-medium"
                      >
                        Monadscan <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}

                  {sbtMinted && (
                    <div className="flex items-center justify-between font-mono text-[11px] bg-background/90 p-2 rounded-md border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[10px] font-sans bg-purple-500/10 text-purple-700 border-purple-200 shrink-0 flex items-center gap-1">
                          <Award className="size-3" /> Civic Hero SBT
                        </Badge>
                        <span className="font-sans text-xs text-foreground font-medium truncate">Soulbound Badge Minted</span>
                      </div>
                      <a
                        href={`https://testnet.monadscan.com/address/0x4A3541e9B7E1C090Ac991825fA46Fe9cbe41eD8f`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-1 font-sans text-xs hover:underline ml-2 shrink-0 font-medium"
                      >
                        SBT Explorer <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(errorMessage || loadError || (!loading && !bounty)) && (
              <p className="text-xs text-destructive font-medium break-words">
                {errorMessage || loadError || 'No bounty found. Create one as Funder first.'}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0">
            {status === 'RESOLVED' ? (
              <div className="w-full space-y-2">
                <Button className="w-full" disabled variant="outline">
                  <ShieldCheck className="size-4 mr-1 text-emerald-600" />
                  Bounty Claimed & Settled
                </Button>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/"
                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-full' })}
                  >
                    Return to Map Overview
                  </Link>
                  <Link
                    href="/funder/1"
                    className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full' })}
                  >
                    New Report <ArrowRight className="size-3 ml-1" />
                  </Link>
                </div>
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
                  disabled={!isFilled || isLoading || !canClaim}
                  onClick={handleClaimBounty}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Releasing BountyVault Escrow & Minting SBT...
                    </span>
                  ) : isFilled ? (
                    `Submit Proof & Claim ${fmt(totalBounty)} MON`
                  ) : (
                    'Fill Proof to Claim Bounty'
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
