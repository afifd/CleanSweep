'use client';

import { useCallback, useEffect, useState } from 'react';

export interface BountyInfo {
  id: string;
  status: 'ACTIVE' | 'CLAIMED' | 'REFUNDED';
  totalPool: string;
  creatorAmount: string;
  boostAmount: string;
  creator: string;
  cleaner: string;
  donorCount: number;
  deadline: number;
  feeAmount: string;
}

/** Reads a bounty (by id, or newest active) from the chain via /api/bounties. No DB. */
export function useBounty(id: string | null) {
  const [bounty, setBounty] = useState<BountyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    // The public RPC throttles bursts, so retry quietly before showing an error.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`/api/bounties${id ? `?id=${encodeURIComponent(id)}` : ''}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load bounty');
        setBounty(data.bounty);
        setError('');
        setLoading(false);
        return;
      } catch (e) {
        if (attempt === 2) setError((e as Error).message);
        else await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { bounty, loading, error, refresh };
}
