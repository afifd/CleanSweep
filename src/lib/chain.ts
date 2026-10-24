// SERVER-ONLY. Never import this file from a client component (it reads private keys).
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  encodePacked,
  formatEther,
  keccak256,
  http,
  isAddress,
  parseEther,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NextResponse } from 'next/server';
import { BOUNTY_VAULT_ABI, CONTRACT_ADDRESSES, MONAD_TESTNET_CHAIN_ID } from './contracts';

const RPC = process.env.MONAD_RPC || process.env.NEXT_PUBLIC_MONAD_RPC || 'https://testnet-rpc.monad.xyz';

export const monadTestnet = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

export const VAULT: Address = CONTRACT_ADDRESSES.BOUNTY_VAULT;
export const ABI = BOUNTY_VAULT_ABI;
export const ZERO: Address = '0x0000000000000000000000000000000000000000';
export const MAX_AMOUNT_MON = 10; // safety cap per tx on the open demo endpoints

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(RPC, { batch: true, retryCount: 5, retryDelay: 400 }),
  pollingInterval: 800,
});

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type Role = 'funder' | 'booster' | 'cleaner' | 'verifier';

const ENV_KEYS: Record<Role, string> = {
  funder: 'FUNDER_1_PK',
  booster: 'BOOSTER_1_PK',
  cleaner: 'CLEANER_1_PK',
  verifier: 'VERIFIER_PK',
};

export function accountFor(role: Role) {
  let raw = process.env[ENV_KEYS[role]];
  // The deployed vault's verifier is currently the funder key; use it unless VERIFIER_PK is set.
  if (!raw && role === 'verifier') raw = process.env.FUNDER_1_PK;
  if (!raw) throw new ApiError(500, `${ENV_KEYS[role]} is not configured on the server`);
  const t = raw.trim();
  return privateKeyToAccount((t.startsWith('0x') ? t : `0x${t}`) as Hex);
}

export function walletFor(role: Role) {
  return createWalletClient({ account: accountFor(role), chain: monadTestnet, transport: http(RPC, { retryCount: 3, retryDelay: 500 }) });
}

export function parseAmountWei(input: unknown): bigint {
  const s = String(input ?? '').trim();
  if (!/^\d+(\.\d{1,18})?$/.test(s)) throw new ApiError(400, 'Invalid amount');
  const wei = parseEther(s);
  if (wei <= 0n) throw new ApiError(400, 'Amount must be greater than 0');
  if (wei > parseEther(String(MAX_AMOUNT_MON))) throw new ApiError(400, `Amount exceeds demo cap of ${MAX_AMOUNT_MON} MON`);
  return wei;
}

export function parseAddress(input: unknown): Address {
  const s = String(input ?? '').trim();
  if (!isAddress(s)) throw new ApiError(400, 'Invalid address');
  return s as Address;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry READS only (public RPC throttles bursts). Never use for sends. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = `${(e as Error)?.name ?? ''} ${(e as Error)?.message ?? ''}`;
      if (/revert|insufficient funds|invalid address/i.test(msg)) break; // deterministic, retrying won't help
      if (i < tries - 1) await sleep(400 * (i + 1));
    }
  }
  throw last;
}

/** Best-effort read: returns null instead of failing a request whose transaction already succeeded. */
export async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await withRetry(fn, 2);
  } catch {
    return null;
  }
}

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

export async function getBountyCount(): Promise<bigint> {
  return withRetry(() => publicClient.readContract({ address: VAULT, abi: ABI, functionName: 'bountyCount' }));
}

export async function readBounty(id: bigint, blockNumber?: bigint) {
  return withRetry(() =>
    publicClient.readContract({ address: VAULT, abi: ABI, functionName: 'getBounty', args: [id], blockNumber })
  );
}

type RawBounty = Awaited<ReturnType<typeof readBounty>>;
const exists = (b: RawBounty) => b.reportId !== ZERO_HASH;

/** Scan the newest few bounties for an ACTIVE one (keeps RPC usage low). */
export async function latestActive(): Promise<{ id: bigint; bounty: RawBounty } | null> {
  const count = await getBountyCount();
  for (let id = count; id > 0n && id > count - 6n; id--) {
    const bounty = await readBounty(id);
    if (bounty.status === 0) return { id, bounty };
  }
  return null;
}

/** Use the requested id (1 RPC read), or fall back to the newest ACTIVE bounty. */
export async function resolveBounty(input: unknown): Promise<{ id: bigint; bounty: RawBounty }> {
  if (input !== undefined && input !== null && String(input) !== '') {
    if (!/^\d+$/.test(String(input))) throw new ApiError(400, 'Invalid bountyId');
    const id = BigInt(String(input));
    if (id < 1n) throw new ApiError(400, 'Invalid bountyId');
    const bounty = await readBounty(id);
    if (!exists(bounty)) throw new ApiError(404, `Bounty #${id} does not exist`);
    return { id, bounty };
  }
  const latest = await latestActive();
  if (!latest) throw new ApiError(404, 'No active bounty found. Create one as Funder first.');
  return latest;
}

/** Same hash BountyVault.computeClaimHash builds on-chain (computed locally = one less RPC call). */
export function claimHashFor(id: bigint, reportId: Hex, cleaner: Address, sigExpiry: bigint): Hex {
  return keccak256(
    encodePacked(
      ['uint256', 'address', 'uint256', 'bytes32', 'address', 'uint256'],
      [BigInt(MONAD_TESTNET_CHAIN_ID), VAULT, id, reportId, cleaner, sigExpiry]
    )
  );
}

const STATUS = ['ACTIVE', 'CLAIMED', 'REFUNDED'] as const;

type Described = {
  id: string;
  status: (typeof STATUS)[number];
  totalPool: string;
  creatorAmount: string;
  boostAmount: string;
  creator: string;
  cleaner: string;
  donorCount: number;
  deadline: number;
  feeAmount: string;
};

// Tiny TTL cache so page refreshes / double fetches don't burn the public RPC quota.
const cache = new Map<string, { t: number; v: Described | null }>();
export const invalidateCache = () => cache.clear();

export async function describeBounty(id: bigint): Promise<Described | null> {
  const key = id.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < 1500) return hit.v;

  const b = await readBounty(id);
  let v: Described | null = null;
  if (exists(b)) {
    const creatorAmount = await withRetry(() =>
      publicClient.readContract({ address: VAULT, abi: ABI, functionName: 'donorContributions', args: [id, b.creator] })
    );
    const total = b.totalPool;
    const creatorPart = creatorAmount > total ? total : creatorAmount;
    v = {
      id: key,
      status: STATUS[b.status] ?? 'ACTIVE',
      totalPool: formatEther(total),
      creatorAmount: formatEther(creatorPart),
      boostAmount: formatEther(total - creatorPart),
      creator: b.creator,
      cleaner: b.cleaner,
      donorCount: Number(b.donorCount),
      deadline: Number(b.deadline),
      feeAmount: formatEther(b.feeAmount),
    };
  }
  cache.set(key, { t: Date.now(), v });
  return v;
}

export async function balanceOf(address: Address): Promise<string> {
  return formatEther(await withRetry(() => publicClient.getBalance({ address })));
}

/**
 * Send a vault transaction robustly on a throttled public RPC.
 * Everything *before* broadcast (gas, nonce, fees) is retried, because nothing has been sent yet.
 * The tx hash is computed locally, so a lost response to the broadcast can't cause a double-send:
 * we simply wait for that hash's receipt.
 */
export async function sendContractTx(
  role: Role,
  call: { functionName: 'createBounty' | 'boostBounty' | 'claimBounty'; args: readonly unknown[]; value?: bigint; gas?: bigint }
) {
  const wallet = walletFor(role);
  const account = wallet.account;
  const data = encodeFunctionData({
    abi: ABI,
    functionName: call.functionName,
    args: call.args,
  } as Parameters<typeof encodeFunctionData>[0]);

  const request = await withRetry(
    () => wallet.prepareTransactionRequest({ account, chain: monadTestnet, to: VAULT, data, value: call.value, gas: call.gas }),
    5
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = await wallet.signTransaction(request as any);
  const hash = keccak256(serialized);

  try {
    await withRetry(() => publicClient.sendRawTransaction({ serializedTransaction: serialized }), 4);
  } catch (e) {
    // If an earlier attempt already reached the node, the retry reports "already known" / "nonce too low".
    if (!/already known|known transaction|already imported|nonce too low/i.test(String((e as Error).message))) throw e;
  }

  const receipt = await withRetry(() => publicClient.waitForTransactionReceipt({ hash, timeout: 25_000 }), 2);
  if (receipt.status !== 'success') throw new ApiError(500, `${call.functionName} transaction reverted`);
  return { hash, receipt, account };
}

/** Wrap a handler so errors always come back as JSON (never a fake success). */
export async function handle(fn: () => Promise<Record<string, unknown>>) {
  try {
    const data = await fn();
    return NextResponse.json({ success: true, ...data });
  } catch (e: unknown) {
    const err = e as { status?: number; shortMessage?: string; message?: string; digest?: string };
    // Let Next.js' own control-flow errors (dynamic-rendering bailout) pass through untouched.
    if (err.digest === 'DYNAMIC_SERVER_USAGE' || /bail out of prerendering/.test(err.message || '')) throw e;
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    const message = err.shortMessage || err.message || 'Unknown error';
    console.error('[api]', message, (e as { details?: string }).details ?? '');
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
