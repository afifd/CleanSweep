'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RoleSplitLayout from '@/components/RoleSplitLayout';
import { FUNDERS } from '@/lib/actors';
import { getAccountFromPrivateKey, formatAddress } from '@/lib/web3';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, Wallet, ArrowRight, Wand2, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface FunderViewProps {
  params: Promise<{ id: string }>;
}

export default function FunderView({ params }: FunderViewProps) {
  const { id } = React.use(params);
  const funder = FUNDERS[id] || FUNDERS['1'];

  const defaultTitle = 'Spanduk Liar & Sampah';
  const defaultLocation = funder.locationLabel || 'Jl. Malioboro No. 42';
  const defaultBounty = funder.defaultAmount || '5.0';
  const coords = funder.coords || { lat: -7.7956, lng: 110.3695 };

  // Form states - initially blank to allow "Fill" action
  const [isFilled, setIsFilled] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [bounty, setBounty] = useState('');
  const [status, setStatus] = useState<'NONE' | 'ACTIVE' | 'RESOLVED'>('NONE');
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [bountyId, setBountyId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto-fill hardcoded values and display the map pin
  const handleAutoFill = () => {
    setTitle(defaultTitle);
    setLocation(defaultLocation);
    setBounty(defaultBounty);
    setIsFilled(true);
    setStatus('ACTIVE'); // Activates map pin at target coords
  };

  const handleLockBounty = async () => {
    if (!isFilled || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bounty || defaultBounty }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lock failed');
      setTxHash(data.txHash);
      setBountyId(data.bountyId);
      setIsLocked(true);
    } catch (err) {
      console.error('Failed to lock bounty:', err);
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const account = getAccountFromPrivateKey(funder.privateKey);
  const displayAddress =
    funder.address && funder.address !== '0x0000000000000000000000000000000000000000'
      ? funder.address
      : account.address;

  return (
    <RoleSplitLayout
      coords={coords}
      status={status}
      bountyAmount={bounty || defaultBounty}
      roleBadge="Funder Persona"
      title={`${title || defaultTitle} - ${location || defaultLocation}`}
    >
      <div className="space-y-4">
        {/* Active Persona Header (Not changeable) */}
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
            <span>{formatAddress(displayAddress)}</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Burner Key</span>
          </div>
        </div>

        {/* Main Action Card with Input Fields */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Report & Lock Escrow Bounty</CardTitle>
              <Badge
                variant={isLocked ? 'default' : isFilled ? 'secondary' : 'outline'}
                className="text-[11px]"
              >
                {isLocked ? 'ESCROW LOCKED' : isFilled ? 'READY TO LOCK' : 'AWAITING DETAILS'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Deposit micro-bounty into Monad escrow contract for community cleaning.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {/* Input 1: Violation Title */}
            <div className="space-y-1">
              <Label htmlFor="funder-title" className="text-xs font-semibold">
                Violation Title
              </Label>
              <Input
                id="funder-title"
                placeholder="e.g. Spanduk Liar / Tumpukan Sampah..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLocked}
                className="text-xs h-9 bg-background"
              />
            </div>

            {/* Input 2: Violation Location */}
            <div className="space-y-1">
              <Label htmlFor="funder-location" className="text-xs font-semibold">
                Location Label
              </Label>
              <Input
                id="funder-location"
                placeholder="e.g. Jl. Malioboro No. 42..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLocked}
                className="text-xs h-9 bg-background"
              />
            </div>

            {/* Input 3: Micro-bounty Amount */}
            <div className="space-y-1">
              <Label htmlFor="funder-bounty" className="text-xs font-semibold">
                Bounty Amount (MON)
              </Label>
              <div className="relative">
                <Input
                  id="funder-bounty"
                  type="number"
                  step="0.5"
                  placeholder="e.g. 5.0"
                  value={bounty}
                  onChange={(e) => setBounty(e.target.value)}
                  disabled={isLocked}
                  className="text-xs h-9 pr-14 font-mono bg-background"
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                  MON
                </span>
              </div>
            </div>

            {/* Violation Image: Empty placeholder vs Filled */}
            <div className="space-y-1 pt-1">
              <Label className="text-xs font-semibold">Photo Evidence</Label>
              {isFilled ? (
                <div className="relative w-full h-36 border rounded-md overflow-hidden bg-muted">
                  <Image
                    src={funder.image || '/images/banner-before.jpg'}
                    alt="Violation Evidence"
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-400" />
                    EXIF Verified • GPS Attached
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-md bg-muted/20 text-muted-foreground p-3 text-center">
                  <ImageIcon className="size-6 mb-1 text-muted-foreground/60" />
                  <span className="text-xs font-medium">No photo uploaded yet</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    Click &quot;Fill&quot; below to autofill evidence and activate map pin
                  </span>
                </div>
              )}
            </div>

            {errorMessage && (
              <p className="text-xs text-destructive font-medium break-words">{errorMessage}</p>
            )}

            {/* Escrow Lock confirmation badge */}
            {isLocked && (
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  <span>Escrow Locked in BountyVault on Monad ({bounty || defaultBounty} MON) — Bounty #{bountyId}</span>
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
            {isLocked ? (
              <div className="w-full space-y-2">
                <Button className="w-full" disabled variant="outline">
                  <CheckCircle2 className="size-4 mr-1 text-emerald-600" />
                  Bounty Active in Escrow Vault
                </Button>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/"
                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-full' })}
                  >
                    View on Feed
                  </Link>
                  <Link
                    href={`/booster/1?bounty=${bountyId}`}
                    className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full' })}
                  >
                    Switch to Booster <ArrowRight className="size-3 ml-1" />
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
                  disabled={!isFilled || isLoading}
                  onClick={handleLockBounty}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Locking into BountyVault...
                    </span>
                  ) : isFilled ? (
                    `Lock ${bounty || defaultBounty} MON Bounty`
                  ) : (
                    'Fill Details to Lock Bounty'
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
