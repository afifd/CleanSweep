'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RoleSplitLayout from '@/components/RoleSplitLayout';
import { CLEANERS, DEMO_COORDS, DEMO_REPORT_ID } from '@/lib/actors';
import { getAccountFromPrivateKey, formatAddress, generateMockTxHash } from '@/lib/web3';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, ShieldCheck, Wallet, ArrowRight, Sparkles, Navigation } from 'lucide-react';
import Link from 'next/link';

interface CleanerViewProps {
  id: string;
}

export default function CleanerView({ id }: CleanerViewProps) {
  const cleaner = CLEANERS[id] || CLEANERS['1'];

  const [status, setStatus] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');

  const account = getAccountFromPrivateKey(cleaner.privateKey);
  const totalBounty = 5.0; // Standard demo amount
  const cleanerPayout = (totalBounty * 0.98).toFixed(2);
  const platformFee = (totalBounty * 0.02).toFixed(2);

  const handleClaimBounty = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 850));
      const hash = generateMockTxHash();
      setTxHash(hash);
      setStatus('RESOLVED');
    } catch (err) {
      console.error('Failed to claim bounty:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleSplitLayout
      coords={DEMO_COORDS}
      status={status}
      bountyAmount={totalBounty.toFixed(1)}
      roleBadge="Cleaner Persona"
      title="Spanduk Liar - Cleaned & Claimed"
    >
      <div className="space-y-4">
        {/* Persona Header */}
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
            <span>{formatAddress(account.address)}</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Burner Key</span>
          </div>
        </div>

        {/* Main Action Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Submit Proof & Claim Escrow</CardTitle>
                <p className="text-xs font-mono text-muted-foreground">Ticket #Malioboro-01 ({DEMO_REPORT_ID.slice(0, 10)}...)</p>
              </div>
              <Badge
                variant={status === 'RESOLVED' ? 'default' : 'secondary'}
                className={status === 'RESOLVED' ? 'bg-emerald-600 text-white' : ''}
              >
                {status === 'RESOLVED' ? 'RESOLVED & SETTLED' : 'VERIFIED PROOF'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Instant settlement on Monad upon GPS verification and cleanup proof.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            {/* Proof Image */}
            <div className="relative w-full h-44 border rounded-md overflow-hidden bg-muted">
              <Image
                src="/images/banner-after.jpg"
                alt="Cleanup Proof After"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-2 left-2 bg-emerald-700/80 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                Cleanup Proof (After)
              </div>
            </div>

            {/* Verification Badges & Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border text-xs">
                <div className="flex items-center gap-2">
                  <Navigation className="size-3.5 text-emerald-600" />
                  <span className="font-medium">Proximity Verification:</span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-300 font-mono text-[11px]">
                  GPS Diff: 0m (Passed)
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-md border">
                <div>
                  <p className="font-semibold text-foreground">Backend ECDSA</p>
                  <p className="text-emerald-600 font-medium">Valid Signature</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Escrow Pool</p>
                  <p className="font-mono">{totalBounty.toFixed(1)} MON</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Cleaner Payout (98%)</p>
                  <p className="font-bold text-emerald-600 font-mono">+{cleanerPayout} MON</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Protocol Fee (2%)</p>
                  <p className="font-mono text-muted-foreground">{platformFee} MON</p>
                </div>
              </div>
            </div>

            {/* Settlement confirmation */}
            {status === 'RESOLVED' && (
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="size-4" />
                  <span>Settlement Complete! {cleanerPayout} MON Transferred</span>
                </div>
                <p className="text-muted-foreground">
                  The Monad smart contract released the escrow funds directly to cleaner address {formatAddress(account.address)}.
                </p>
                {txHash && (
                  <div className="flex items-center justify-between font-mono text-[11px] bg-background/80 p-1.5 rounded border">
                    <span className="truncate max-w-[220px]">Tx: {txHash}</span>
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
              <Button
                className="w-full font-semibold"
                size="lg"
                disabled={isLoading}
                onClick={handleClaimBounty}
              >
                {isLoading ? 'Releasing Escrow on Monad...' : `Submit Proof & Claim ${cleanerPayout} MON`}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </RoleSplitLayout>
  );
}
