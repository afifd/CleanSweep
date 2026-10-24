export const MONAD_TESTNET_CHAIN_ID = 10143;

// Canonical / default deployed addresses on Monad testnet
export const CONTRACT_ADDRESSES = {
  BOUNTY_VAULT: (process.env.NEXT_PUBLIC_BOUNTY_VAULT_ADDRESS ||
    "0x9A65D8F0B8674d827f2B71a2be10c14948a47Be9") as `0x${string}`,
  CIVIC_HERO_SBT: (process.env.NEXT_PUBLIC_CIVIC_HERO_SBT_ADDRESS ||
    "0x4296C01Acf19E36181E99187a5a3aC7733Ce3F21") as `0x${string}`,
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    "0x754704Bc059F8C67012fEd69BC8A327a5aafb603") as `0x${string}`,
};

export const MONAD_TESTNET_PARAMS = {
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://testnet.monadscan.com" },
    socialscan: { name: "Socialscan", url: "https://monad-testnet.socialscan.io" },
  },
  testnet: true,
};

export const BOUNTY_VAULT_ABI = [
  {
    type: "function",
    name: "bountyCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createBounty",
    inputs: [
      { name: "reportId", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "durationSeconds", type: "uint64" },
    ],
    outputs: [{ name: "bountyId", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "boostBounty",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "claimBounty",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "cleaner", type: "address" },
      { name: "sigExpiry", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "refundBounty",
    inputs: [{ name: "bountyId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getBounty",
    inputs: [{ name: "bountyId", type: "uint256" }],
    outputs: [
      {
        components: [
          { name: "reportId", type: "bytes32" },
          { name: "creator", type: "address" },
          { name: "token", type: "address" },
          { name: "totalPool", type: "uint256" },
          { name: "feeAmount", type: "uint256" },
          { name: "createdAt", type: "uint64" },
          { name: "deadline", type: "uint64" },
          { name: "status", type: "uint8" },
          { name: "cleaner", type: "address" },
          { name: "donorCount", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDonors",
    inputs: [{ name: "bountyId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "feeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "treasury",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BountyCreated",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "reportId", type: "bytes32", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "initialAmount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BountyBoosted",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "donor", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "additionalAmount", type: "uint256", indexed: false },
      { name: "newTotalPool", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BountyClaimed",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "reportId", type: "bytes32", indexed: true },
      { name: "cleaner", type: "address", indexed: true },
      { name: "netPayout", type: "uint256", indexed: false },
      { name: "feePaid", type: "uint256", indexed: false },
      { name: "sbtMinted", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BountyRefunded",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "donorCount", type: "uint256", indexed: false },
      { name: "totalRefunded", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "HeroSBTClaimed",
    inputs: [
      { name: "cleaner", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
] as const;

export const CIVIC_HERO_SBT_ABI = [
  {
    type: "function",
    name: "hasHeroBadge",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextTokenId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
