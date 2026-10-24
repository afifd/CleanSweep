# CleanSweep — Civic DePIN Micro-Bounties on Monad Testnet

CleanSweep enables citizens and property owners to report illegal street banners and visual blight, lock micro-bounties in escrow, enable neighbors to boost reward pools, and disburse rewards to verified field cleaners upon cryptographic proof-of-cleanup.

## Architecture

- **`contracts/`**: Foundry smart contract suite on Monad Testnet (`chainId: 10143`).
  - `BountyVault.sol`: Multi-donor micro-bounty escrow, ECDSA backend authorization, fee distribution, timeout refunds, and SBT integration.
  - `CivicHeroSBT.sol`: Non-transferable ERC-721 Soulbound Token recognizing verified cleaners.
  - `verify.sh`: Script calling the Monad verification API (`https://agents.devnads.com/v1/verify`) across MonadVision, Socialscan, and Monadscan.
- **`web/`**: Mobile-first Next.js PWA frontend.
  - Embedded MPC & social login via Para SDK (`@getpara/react-sdk`).
  - Interactive Leaflet pin tracker with red (Active), yellow (Verifying), green (Resolved) markers.
  - Camera-only live video stream capture to block synthetic photo spoofing.
  - Native Monad 400ms block inclusion handling and tight gas controls.
- **`web/src/app/api/verify-claim/route.ts`**: Backend verification oracle stub performing EXIF timestamp validation, Haversine spherical distance calculation ($<150\text{m}$), and ECDSA signature generation.
- **`indexer/`**: Envio HyperIndex configuration for indexing `BountyCreated`, `BountyBoosted`, `BountyClaimed`, `BountyRefunded`, and `HeroSBTClaimed` events.
- **`LEGAL_AND_SECURITY.md`**: Legal-by-design framework distinguishing public space blight clearance from private property trespass (mitigating KUHP Pasal 406 liabilities).

## Smart Contract Tests

```bash
cd contracts
forge test
```
All 7 unit and integration tests pass (accounting, signature forgery protection, replay prevention, reentrancy safety, expiry refunds, and soulbound transfer blocking).
