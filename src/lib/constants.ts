export const DEMO_CONFIG = {
  reportId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
  targetCoords: { lat: -7.7956, lng: 110.3695 }, // Fixed demo point
  photoBeforeHash: '0xaaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999' as `0x${string}`,
  photoAfterHash: '0x9999888877776666555544443333222211110000ffffeeeeddddccccbbbbaaaa' as `0x${string}`,
  funderPk: (process.env.NEXT_PUBLIC_FUNDER_PK || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as `0x${string}`,
  cleanerPk: (process.env.NEXT_PUBLIC_CLEANER_PK || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d') as `0x${string}`,
  bountyContractAddress: (process.env.NEXT_PUBLIC_BOUNTY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  rpcUrl: 'https://testnet-rpc.monad.xyz', // Or target Monad devnet RPC
};
