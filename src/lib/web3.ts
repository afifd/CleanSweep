import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const MONAD_TESTNET_RPC = process.env.NEXT_PUBLIC_MONAD_RPC || 'https://testnet-rpc.monad.xyz';
export const BOUNTY_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_BOUNTY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const publicClient = createPublicClient({
  transport: http(MONAD_TESTNET_RPC),
});

export const getActorWalletClient = (privateKey: `0x${string}`) => {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    transport: http(MONAD_TESTNET_RPC),
  });
};

export const getAccountFromPrivateKey = (privateKey: `0x${string}`) => {
  return privateKeyToAccount(privateKey);
};

export const formatAddress = (address: string) => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const generateMockTxHash = (): `0x${string}` => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash as `0x${string}`;
};

export const BOUNTY_VAULT_ABI = [
  {
    type: 'function',
    name: 'createBounty',
    inputs: [
      { name: 'reportId', type: 'bytes32' },
      { name: 'photoHash', type: 'bytes32' },
      { name: 'expiry', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'boostBounty',
    inputs: [
      { name: 'reportId', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'claimBounty',
    inputs: [
      { name: 'reportId', type: 'bytes32' },
      { name: 'cleaner', type: 'address' },
      { name: 'photoHash', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
