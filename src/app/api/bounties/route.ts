import { describeBounty, getBountyCount, handle, latestActive } from '@/lib/chain';

export async function GET(req: Request) {
  return handle(async () => {
    const idParam = new URL(req.url).searchParams.get('id');
    if (idParam) {
      if (!/^\d+$/.test(idParam) || BigInt(idParam) < 1n) return { bounty: null };
      return { bounty: await describeBounty(BigInt(idParam)) };
    }
    const latest = await latestActive();
    if (!latest) return { bounty: null, count: (await getBountyCount()).toString() };
    return { bounty: await describeBounty(latest.id) };
  });
}
