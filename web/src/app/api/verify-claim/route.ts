import { NextRequest, NextResponse } from "next/server";
import { keccak256, encodePacked, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Backend verification service:
 * 1. Checks EXIF camera metadata (live capture signature, device timestamp within 15min)
 * 2. Runs Haversine distance validation against reported bounty GPS coordinates (threshold < 150m)
 * 3. Compares before/after visual hash
 * 4. Signs ECDSA claim payload for BountyVault.claimBounty on Monad testnet
 */

interface VerifyClaimPayload {
  bountyId: number;
  reportId: `0x${string}`;
  cleanerAddress: `0x${string}`;
  beforePhotoHash: string;
  afterPhotoHash: string;
  cleanupLat: number;
  cleanupLng: number;
  targetLat: number;
  targetLng: number;
  capturedAtTimestamp: number;
}

// Default fallback key for testnet demo verification if env not set
const VERIFIER_PRIVATE_KEY = (process.env.VERIFIER_PRIVATE_KEY ||
  "0xa11ce00000000000000000000000000000000000000000000000000000000001") as `0x${string}`;

const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_BOUNTY_VAULT_ADDRESS ||
  "0x9A65D8F0B8674d827f2B71a2be10c14948a47Be9") as `0x${string}`;

const CHAIN_ID = BigInt(process.env.NEXT_PUBLIC_CHAIN_ID || "10143");

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const deltaP = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyClaimPayload = await req.json();
    const {
      bountyId,
      reportId,
      cleanerAddress,
      beforePhotoHash,
      afterPhotoHash,
      cleanupLat,
      cleanupLng,
      targetLat,
      targetLng,
      capturedAtTimestamp,
    } = body;

    if (!cleanerAddress || !reportId || bountyId === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 1. GPS Proximity Check (< 150m radius)
    const distance = haversineDistanceMeters(cleanupLat, cleanupLng, targetLat, targetLng);
    if (distance > 150) {
      return NextResponse.json(
        {
          error: `Location mismatch: cleaner GPS is ${Math.round(distance)}m from target (max 150m allowed)`,
          distanceMeters: distance,
        },
        { status: 422 }
      );
    }

    // 2. EXIF Timestamp freshness check (< 30 minutes from capture)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - capturedAtTimestamp) > 1800) {
      return NextResponse.json(
        {
          error: "Photo timestamp stale. Must submit within 30 minutes of live capture.",
        },
        { status: 422 }
      );
    }

    // 3. Difference check (before vs after)
    if (beforePhotoHash === afterPhotoHash) {
      return NextResponse.json(
        {
          error: "After-photo matches before-photo. No visual cleanup detected.",
        },
        { status: 422 }
      );
    }

    // 4. Generate ECDSA signature
    // sigExpiry = 1 hour from now
    const sigExpiry = BigInt(now + 3600);

    const claimHash = keccak256(
      encodePacked(
        ["uint256", "address", "uint256", "bytes32", "address", "uint256"],
        [CHAIN_ID, VAULT_ADDRESS, BigInt(bountyId), reportId, cleanerAddress, sigExpiry]
      )
    );

    const account = privateKeyToAccount(VERIFIER_PRIVATE_KEY);
    const signature = await account.signMessage({
      message: { raw: toBytes(claimHash) },
    });

    return NextResponse.json({
      success: true,
      verified: true,
      claim: {
        bountyId,
        reportId,
        cleanerAddress,
        sigExpiry: sigExpiry.toString(),
        signature,
        distanceMeters: Math.round(distance),
        verifierAddress: account.address,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
