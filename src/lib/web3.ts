import { privateKeyToAccount } from 'viem/accounts';

export const getAccountFromPrivateKey = (privateKey: `0x${string}`) => {
  return privateKeyToAccount(privateKey);
};

export const formatAddress = (address: string) => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
