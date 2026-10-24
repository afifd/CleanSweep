# CleanSweep — Legal-by-Design Architecture & Offchain Verification Framework

## 1. Statutory Context & KUHP Pasal 406 Mitigation
Under the Indonesian Penal Code (Kitab Undang-Undang Hukum Pidana / KUHP) Pasal 406 (and equivalent municipal vandalism ordinances globally):
- *Destruction, damage, or unauthorized removal of property belonging to another party constitutes a criminal misdemeanor or tortious interference.*

### Public Space Jurisdiction vs. Private Property Distinction
CleanSweep enforces a strict jurisdictional separation:
1. **Public Infrastructure Scope (Authorized):**
   - Unauthorized flyers, adhesive commercial stickers, and vinyl banners (e.g., predatory *pinjol* / illegal lending advertisements) affixed to public lampposts, overpass handrails, utility poles, and public traffic signs are statutory visual blight subject to municipal clearance under Public Order Bylaws (Perda Ketertiban Umum).
2. **Private Property Boundary (Protected):**
   - Cleaners are strictly prohibited from entering private parcels, residential compound gates, or commercial shopfront awnings without an explicit cryptographic attestation or sign-off from the verified property owner.
   - Bounties flagged on private property require the property owner to deposit the micro-bounty using their authenticated Para wallet address.

---

## 2. Offchain Verification & Cryptographic Authorization Flow

To prevent spam, synthetic generation, and false cleanup claims without incurring excessive gas costs for full computer-vision processing onchain:

1. **Telemetry & EXIF Inspection:**
   - Field camera captures are restricted to real-time WebRTC streams (gallery file uploads are disabled in the PWA client).
   - High-resolution photographs remain offchain (IPFS / Arweave / S3). Only the cryptographic digest (`keccak256(photoContent + deviceEXIF)`) is anchored to the report identifier.
2. **Haversine Geofencing Check:**
   - The backend verification oracle computes Haversine spherical distance between:
     $$\text{Distance} = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   - Must fall within $r \le 150\text{ meters}$ of the initial report's GPS coordinates.
3. **ECDSA Oracle Signature:**
   - Once automated checks pass (fresh timestamp $<30\text{ min}$, GPS distance $<150\text{m}$, visual difference detected), the backend signer computes:
     $$\text{claimHash} = \text{keccak256}(\text{chainId}, \text{vault}, \text{bountyId}, \text{reportId}, \text{cleaner}, \text{sigExpiry})$$
   - It signs this hash using standard Ethereum Signed Message format (`toEthSignedMessageHash()`).
4. **Onchain Settlement (`BountyVault.sol`):**
   - Cleaner broadcasts `claimBounty(...)` with the signature.
   - Replay protection mapping (`executedClaims`) prevents signature reuse.
   - 2.5% protocol fee is routed to the Safe multi-sig treasury; 97.5% net payout is transferred to the cleaner.
   - First-time cleaners automatically receive a non-transferable `CivicHeroSBT` token.
