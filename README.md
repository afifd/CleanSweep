# CleanSweep

**Civic micro-bounties on Monad.** Residents fund a bounty to get an illegal banner or pile of trash cleaned up. Neighbours can boost the pool. A cleaner does the job and is paid instantly from an on-chain escrow.

There are three actors:

| Actor | What they do | On-chain call |
|---|---|---|
| **Funder** | Reports the problem and locks MON in escrow | `createBounty` (MON leaves the funder's wallet) |
| **Booster** | Adds more MON to an existing bounty's pool | `boostBounty` (MON leaves the booster's wallet) |
| **Cleaner** | Cleans up (mocked) and claims the pool | `claimBounty` (cleaner receives the pool minus the platform fee) |

> **Hackathon scope:** the GPS check, the photos and the "verification" are **mocked**. The money flow is real. Every button sends a real transaction on **Monad Testnet** through the `BountyVault` smart contract. There is no database: all state is read from the chain.

---

## How it works

```
Browser (Next.js pages)  ──fetch──►  /api/* routes (server)  ──viem──►  BountyVault on Monad Testnet
  funder / booster / cleaner         build, sign and send the tx          holds the escrow
```

- **Backend job:** build and send the transaction. Each role's server-side key signs only that role's action.
- **Escrow:** MON is deducted from the sender's wallet when the funder creates a bounty or the booster boosts it, and it sits in the vault. When the cleaner claims, the vault pays the cleaner 97.5% and the treasury 2.5%.
- **Claim approval:** the backend "verifier" signs an ECDSA message that the contract checks with `ecrecover`. Verification is mocked, so it always signs for an active bounty.
- **State:** `GET /api/bounties` reads pools and statuses from the contract. Pages pass the bounty with `?bounty=ID`.

| Route | Method | Role key used | Body |
|---|---|---|---|
| `/api/escrow/create` | POST | funder | `{ "amount": "5.0" }` |
| `/api/escrow/boost` | POST | booster | `{ "amount": "2.0", "bountyId": "7" }` |
| `/api/settle-bounty` | POST | cleaner (and verifier signature) | `{ "bountyId": "7" }` |
| `/api/bounties` | GET | none (read only) | `?id=7` (optional, defaults to newest active) |

Each write route caps the amount at 10 MON per call.

---

## Quick start

### 1. Prerequisites

- **Node.js 20+** and npm
- **3 Monad Testnet wallets** (any EVM wallet works; create fresh burner wallets): one funder, one booster, one cleaner
- **Testnet MON** in each wallet (get it from the [Monad faucet](https://faucet.monad.xyz)). Rough budget for a demo run:
  - Funder: the bounty amount + gas (for example 5 MON)
  - Booster: the boost amount + gas (for example 2 MON)
  - Cleaner: about 0.2 MON for gas. The cleaner pays gas for the claim, then receives the payout.

> **Gas on Monad is charged on the gas *limit***, so a claim costs roughly 0.07 MON. Use meaningful bounty amounts (1 MON or more), otherwise the cleaner's net looks like a loss.

### 2. Clone and install

```bash
git clone <your-repo-url> cleansweep
cd cleansweep
npm install
```

### 3. Create your `.env`

```bash
cp .env.example .env
```

Open `.env` and fill in **your own** wallets. The `*_PK` values are private keys (with or without `0x`). The `*_ADDRESS` values are the matching public addresses, used only for display.

```ini
# --- Server-only burner keys (NEVER commit these) ---
FUNDER_1_PK=your_funder_private_key
BOOSTER_1_PK=your_booster_private_key
CLEANER_1_PK=your_cleaner_private_key

# --- Public addresses of the same wallets (shown in the UI) ---
NEXT_PUBLIC_FUNDER_1_ADDRESS=0xYourFunderAddress
NEXT_PUBLIC_BOOSTER_1_ADDRESS=0xYourBoosterAddress
NEXT_PUBLIC_CLEANER_1_ADDRESS=0xYourCleanerAddress

# --- Strongly recommended: your own RPC endpoint (see "RPC" below) ---
# MONAD_RPC=https://your-provider.example/your-key
```

Optional variables:

| Variable | Default | Purpose |
|---|---|---|
| `MONAD_RPC` | `https://testnet-rpc.monad.xyz` | RPC endpoint used by the API routes |
| `VERIFIER_PK` | falls back to `FUNDER_1_PK` | Key that signs claim approvals. It **must** match the vault's on-chain `verifier()` (see below). |
| `NEXT_PUBLIC_BOUNTY_VAULT_ADDRESS` | `0xE0c21974e6617B4FC99cD5f237889E0dF0067Da2` | Vault contract address |
| `NEXT_PUBLIC_CIVIC_HERO_SBT_ADDRESS` | `0x4A3541e9B7E1C090Ac991825fA46Fe9cbe41eD8f` | Soulbound badge contract |

> ⚠️ **Important, the verifier:** the default vault was deployed with the original funder wallet as its `verifier`. A claim only succeeds if it is signed by the vault's verifier. If you use **your own** wallets with the default vault, claims will fail with an invalid-signature error. Pick one of these:
>
> 1. **Recommended: deploy your own vault** (next section). You then control the verifier, and your funder wallet can be it.
> 2. Ask the owner of the shared vault to call `setVerifier(<your funder address>)`.

### 4. Deploy your own vault (once)

This needs [Foundry](https://book.getfoundry.sh/getting-started/installation). The contract libraries are already vendored in `contracts/lib`.

```bash
cd contracts
forge test                      # optional: 7 tests should pass

export DEPLOYER_PRIVATE_KEY=0x<funder private key, 0x-prefixed>
export VERIFIER_ADDRESS=<funder address>      # the wallet whose key the backend signs claims with
export TREASURY_ADDRESS=<any address that should receive the 2.5% fee>

forge script script/DeployCleanSweep.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast
cd ..
```

The script prints the `CivicHeroSBT` and `BountyVault` addresses. Put them in `.env`:

```ini
NEXT_PUBLIC_BOUNTY_VAULT_ADDRESS=0x...your BountyVault...
NEXT_PUBLIC_CIVIC_HERO_SBT_ADDRESS=0x...your CivicHeroSBT...
```

If `VERIFIER_ADDRESS` is your funder wallet, no `VERIFIER_PK` is needed. To use a separate verifier wallet, set `VERIFIER_ADDRESS` to its address and add `VERIFIER_PK=<its key>` to `.env`.

### 5. Run

```bash
npm run dev          # development, http://localhost:3000
# or
npm run build && npm run start     # production build
```

---

## Using the app (the demo flow)

Use the **Demo** dock at the bottom of every page to switch between roles.

1. **Funder** → `/funder/1`
   Click **Fill** to autofill the report, set the amount (for example `5`), then click **Lock … MON Bounty**. Your wallet is debited and the tx hash plus a Monadscan link appear. Click **Switch to Booster**.
2. **Booster** → `/booster/1?bounty=<id>`
   You see the real pool. Enter an amount (for example `2`) and click **Boost Bounty**. The pool grows. Click **Switch to Cleaner**.
3. **Cleaner** → `/cleaner/1?bounty=<id>`
   Click **Fill** (the mock after-photo and GPS proof), then **Submit Proof & Claim**. The cleaner wallet receives the pool minus the 2.5% fee, and the page shows the transaction and balances.

Check anything on [Monad Testnet Monadscan](https://testnet.monadscan.com).

---

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. In **Project Settings → Environment Variables**, add the same variables as your `.env` (`FUNDER_1_PK`, `BOOSTER_1_PK`, `CLEANER_1_PK`, the three `NEXT_PUBLIC_*_ADDRESS` values, the two vault/SBT addresses, and `MONAD_RPC`). `.env` is git-ignored, so Vercel will not have your keys unless you add them here.
3. Deploy.

> **Security note:** this demo uses burner keys on the server and its API routes are unauthenticated. Anyone with the URL can make your demo wallets spend testnet MON (up to 10 MON per call). Use **testnet-only throwaway wallets** and rotate or abandon them after the demo. Never put mainnet keys in this project.

---

## RPC

The public endpoint `https://testnet-rpc.monad.xyz` is rate-limited (about 15 requests per second per IP) and will occasionally return `Too Many Requests`. The API routes retry reads and are careful never to double-send a transaction, but for a live demo you should set `MONAD_RPC` to a private endpoint from a provider such as Alchemy, QuickNode or dRPC (free tiers are enough).

---

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `…_PK is not configured on the server` | A key is missing from `.env` (or from Vercel's environment variables). |
| `HTTP request failed` / `RPC Request failed` | Public RPC rate limit. Wait a few seconds and retry, or set `MONAD_RPC`. A failed claim never moves funds, so retrying is safe. |
| Claim fails with an invalid-signature error | The backend verifier does not match the vault's `verifier()`. See the "verifier" note above. |
| `insufficient funds` | Fund the wallet with more testnet MON. Remember Monad charges gas on the gas limit. |
| `Bounty #N is not active` | That bounty was already claimed or refunded. Create a new one as Funder. |
| `No active bounty found` | Nothing to boost or claim yet. Create one as Funder first. |
| Cleaner page shows nothing | Open it with `?bounty=<id>`, or create a bounty first. |

---

## Project layout

```
src/app/api/            transaction routes (create, boost, settle-bounty) and /bounties read route
src/lib/chain.ts        server-only: viem clients, key loading, validation, retry-safe tx sender
src/lib/contracts.ts    vault ABI and default contract addresses
src/lib/use-bounty.ts   client hook that reads a bounty from /api/bounties
src/components/         funder / booster / cleaner views, map, UI kit
contracts/              Foundry project: BountyVault.sol, CivicHeroSBT.sol, tests, deploy script
```

## Contract notes

- `BountyVault.sol` supports native MON (and ERC-20), multi-donor pools, claim signatures bound to chain, vault, bounty, cleaner and expiry (replay-protected), and refunds after expiry.
- Platform fee: 2.5% (`feeBps = 250`, owner-adjustable up to 10% with `setFeeBps`).
- The first successful claim also mints the cleaner a soulbound "Civic Hero" badge.
- See [`AUDIT_REPORT.md`](./AUDIT_REPORT.md) for the project audit and the roadmap against the full PRD (real GPS and camera capture, whitelist for public spaces, real wallet connect).
