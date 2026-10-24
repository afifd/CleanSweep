import { formatEther, parseEventLogs } from 'viem';
import { ABI, ApiError, accountFor, balanceOf, claimHashFor, handle, invalidateCache, parseAddress, resolveBounty, safe, sendContractTx, walletFor } from '@/lib/chain';

export const maxDuration = 30;

// Cleaner claim. Verification (GPS/photo) is mocked: the backend verifier always signs for an ACTIVE bounty.
// The cleaner's own wallet sends claimBounty, so the payout lands in the cleaner's wallet.
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const cleanerWallet = walletFor('cleaner');
    const cleanerAddress = body.cleanerAddress ? parseAddress(body.cleanerAddress) : cleanerWallet.account.address;

    // Same tick => viem batches these into a single HTTP request.
    const [{ id: bountyId, bounty }, balanceBefore] = await Promise.all([
      resolveBounty(body.bountyId),
      safe(() => balanceOf(cleanerAddress)),
    ]);
    if (bounty.status !== 0) throw new ApiError(409, `Bounty #${bountyId} is not active (already claimed or refunded)`);

    const sigExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const claimHash = claimHashFor(bountyId, bounty.reportId, cleanerAddress, sigExpiry);
    const signature = await accountFor('verifier').signMessage({ message: { raw: claimHash } });

    const { hash: txHash, receipt } = await sendContractTx('cleaner', {
      functionName: 'claimBounty',
      args: [bountyId, cleanerAddress, sigExpiry, signature],
      // Monad bills the gas LIMIT, and eth_estimateGas over-shoots this call (~1.4M, ~0.15 MON).
      // A claim incl. first-time SBT mint measures ~330k in tests, so 500k leaves headroom at ~1/3 the cost.
      gas: 500_000n,
    });
    invalidateCache();

    const log = parseEventLogs({ abi: ABI, eventName: 'BountyClaimed', logs: receipt.logs })[0];
    return {
      txHash,
      bountyId: bountyId.toString(),
      cleanerAddress,
      totalPool: formatEther(bounty.totalPool),
      netPayout: log ? formatEther(log.args.netPayout) : null,
      fee: log ? formatEther(log.args.feePaid) : null,
      sbtMinted: log ? log.args.sbtMinted : false,
      balanceBefore,
      balanceAfter: await safe(() => balanceOf(cleanerAddress)),
    };
  });
}
