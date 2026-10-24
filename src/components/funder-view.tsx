'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RoleSplitLayout from '@/components/RoleSplitLayout';
import { FUNDERS, DEMO_COORDS, DEMO_REPORT_ID } from '@/lib/actors';
import { getAccountFromPrivateKey, formatAddress, generateMockTxHash } from '@/lib/web3';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ExternalLink,
  CheckCircle2,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Wand2,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

interface FunderViewProps {
  params: Promise<{ id: string }>;
}

export default function FunderView({ params }: FunderViewProps) {
  const { id } = React.use(params);
  const funder = FUNDERS[id] || FUNDERS['1'];

  const defaultTitle = id === '2' ? 'Tumpukan Sampah Liar' : 'Spanduk Liar Lippo Mall';
  const defaultLocation = funder.locationLabel || 'Jl. Malioboro No. 42';
  const defaultBounty = funder.defaultAmount || '5.0';
  const imageSrc = funder.image || '/images/banner-before.jpg';
  const coords = funder.coords || DEMO_COORDS;
  const account = getAccountFromPrivateKey(funder.privateKey);

  // Form states - initially blank to allow "Fill" action
  const [isFilled, setIsFilled] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [bounty, setBounty] = useState('');
  const [status, setStatus] = useState<'NONE' | 'ACTIVE' | 'RESOLVED'>('NONE');
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');

  // Auto-fill hardcoded values and display the map pin
  const handleAutoFill = () => {
    setTitle(defaultTitle);
    setLocation(defaultLocation);
    setBounty(defaultBounty);
    setIsFilled(true);
    setStatus('ACTIVE'); // Activates map pin at target coords
  };

  const handleLockBounty = async () => {
    if (!isFilled) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 850));
      const hash = generateMockTxHash();
      setTxHash(hash);
      setIsLocked(true);
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
            <span>{formatAddress(account.address)}</span>
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
              <Label htmlFor="report-title" className="text-xs font-semibold">
                Violation Title
              </Label>
              <Input
                id="report-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spanduk Liar Lippo Mall"
                className="h-9 text-xs"
                disabled={isLocked}
              />
            </div>

            {/* Input 2: Location */}
            <div className="space-y-1">
              <Label htmlFor="report-location" className="text-xs font-semibold">
                Location / Address
              </Label>
              <div className="relative">
                <Input
                  id="report-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Jl. Malioboro No. 42"
                  className="h-9 text-xs pl-7"
                  disabled={isLocked}
                />
                <MapPin className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Input 3: Bounty Amount */}
            <div className="space-y-1">
              <Label htmlFor="report-bounty" className="text-xs font-semibold">
                Bounty Escrow Amount
              </Label>
              <div className="relative">
                <Input
                  id="report-bounty"
                  value={bounty}
                  onChange={(e) => setBounty(e.target.value)}
                  placeholder="e.g. 5.0"
                  className="h-9 text-xs pr-14 font-mono font-semibold"
                  disabled={isLocked}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-primary font-mono pointer-events-none">
                  MON
                </span>
              </div>
            </div>

            {/* Input 4: Image Evidence Display / Placeholder */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Evidence Photo</Label>
              {isFilled ? (
                <div className="relative w-full h-36 border rounded-md overflow-hidden bg-muted">
                  <Image
                    src={imageSrc}
                    alt="Evidence Before"
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    Initial Photo Attached
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-md bg-muted/20 text-muted-foreground p-3 text-center">
                  <ImageIcon className="size-6 mb-1 text-muted-foreground/60" />
                  <span className="text-xs font-medium">No evidence photo attached</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    Click &quot;Fill&quot; below to autofill form and attach photo
                  </span>
                </div>
              )}
            </div>

            {/* Geotag & Ticket Meta info (shows when filled) */}
            {isFilled && (
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-md border">
                <div>
                  <p className="font-semibold text-foreground">Target Coordinates</p>
                  <p className="font-mono text-muted-foreground">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Ticket ID</p>
                  <p className="font-mono text-muted-foreground">
                    {DEMO_REPORT_ID.slice(0, 10)}...
                  </p>
                </div>
              </div>
            )}

            {/* Success state info */}
            {isLocked && (
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
            {isLocked ? (
              <div className="w-full space-y-2">
                <Button className="w-full" disabled variant="outline">
                  <ShieldCheck className="size-4 mr-1 text-emerald-600" />
                  Bounty Active ({bounty || defaultBounty} MON)
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
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAutoFill}
                    className="w-full font-bold bg-green-600 hover:bg-green-700 active:scale-98 text-white shadow-sm transition-all"
                  >
                    <Wand2 className="size-3.5 mr-1.5 fill-white text-white" /> Fill
                  </Button>
                </div>

                <Button
                  className="w-full font-semibold"
                  size="lg"
                  disabled={!isFilled || isLoading}
                  onClick={handleLockBounty}
                >
                  {isLoading
                    ? 'Locking on Monad Testnet...'
                    : isFilled
                    ? `Lock ${bounty || defaultBounty} MON Bounty`
                    : 'Fill to Lock Bounty'}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </RoleSplitLayout>
  );
}
