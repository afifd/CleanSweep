import { keccak256, parseEventLogs, toHex } from 'viem';
import { ABI, ZERO, ApiError, balanceOf, handle, invalidateCache, parseAmountWei, safe, sendContractTx } from '@/lib/chain';

export const maxDuration = 30;

// Funder locks MON in escrow: createBounty(reportId, native, 0, 7 days) with msg.value.
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const value = parseAmountWei(body.amount);
    const reportId = keccak256(toHex(`cleansweep-${Date.now()}-${crypto.randomUUID()}`));

    const { hash: txHash, receipt, account } = await sendContractTx('funder', {
      functionName: 'createBounty',
      args: [reportId, ZERO, 0n, 604800n],
      value,
    });
    invalidateCache();

    const log = parseEventLogs({ abi: ABI, eventName: 'BountyCreated', logs: receipt.logs })[0];
    if (!log) throw new ApiError(500, 'BountyCreated event not found');

    // The tx is already final here; a throttled balance read must not turn it into an error.
    return {
      txHash,
      bountyId: log.args.bountyId.toString(),
      reportId,
      funderBalance: await safe(() => balanceOf(account.address)),
    };
  });
}
