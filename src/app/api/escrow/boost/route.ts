import { formatEther } from 'viem';
import { ApiError, balanceOf, handle, invalidateCache, parseAmountWei, resolveBounty, safe, sendContractTx } from '@/lib/chain';

export const maxDuration = 30;

// Booster adds MON to an existing active bounty: boostBounty(bountyId, 0) with msg.value.
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const value = parseAmountWei(body.amount ?? body.boostAmount);
    const { id: bountyId, bounty } = await resolveBounty(body.bountyId);
    if (bounty.status !== 0) throw new ApiError(409, `Bounty #${bountyId} is not active`);

    const { hash: txHash, account } = await sendContractTx('booster', {
      functionName: 'boostBounty',
      args: [bountyId, 0n],
      value,
    });
    invalidateCache();

    return {
      txHash,
      bountyId: bountyId.toString(),
      // Derived from the pre-read pool + the amount we just sent; no extra RPC call needed.
      newPool: formatEther(bounty.totalPool + value),
      boosterBalance: await safe(() => balanceOf(account.address)),
    };
  });
}
