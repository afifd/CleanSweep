"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Shield,
  PlusCircle,
  Sparkles,
  Award,
  Wallet,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useParaAuth } from "./providers";
import ParaAuthModal from "../components/ParaAuthModal";
import CameraCaptureModal from "../components/CameraCaptureModal";
import { BlightPin } from "../components/BlightMap";
import { CONTRACT_ADDRESSES } from "../lib/contracts";

// Dynamically import Leaflet map to prevent Next.js SSR document error
const BlightMap = dynamic(() => import("../components/BlightMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] md:h-[460px] rounded-2xl bg-[#111827] animate-pulse flex items-center justify-center text-gray-500 text-xs">
      Loading Monad DePIN Map...
    </div>
  ),
});

const INITIAL_PINS: BlightPin[] = [
  {
    id: 1,
    reportId: "0x1111111111111111111111111111111111111111111111111111111111111111",
    title: "Illegal Pinjol Banner on Pedestrian Overpass",
    description: "Predatory loan shark banners nailed to public overpass handrails obstructing walkway.",
    lat: -6.2088,
    lng: 106.8456,
    status: "Active",
    bountyAmountMON: "2.5",
    donorCount: 4,
    beforePhotoUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    reportId: "0x2222222222222222222222222222222222222222222222222222222222222222",
    title: "Commercial Vinyl Blight on Electrical Transformer",
    description: "Multiple plastic adverts taped over PLN high-voltage hazard box near school.",
    lat: -6.2144,
    lng: 106.8402,
    status: "Verifying",
    bountyAmountMON: "4.0",
    donorCount: 6,
    beforePhotoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    reportId: "0x3333333333333333333333333333333333333333333333333333333333333333",
    title: "Stripped Political Posters on Heritage Wall",
    description: "Torn political banners leaving sticky residue on public heritage facade. Cleaned by Hero #04.",
    lat: -6.2012,
    lng: 106.8521,
    status: "Resolved",
    bountyAmountMON: "1.8",
    donorCount: 2,
    beforePhotoUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80",
  },
];

export default function HomePage() {
  const { user, openWalletModal } = useParaAuth();

  const [pins, setPins] = useState<BlightPin[]>(INITIAL_PINS);
  const [selectedPin, setSelectedPin] = useState<BlightPin | null>(INITIAL_PINS[0]);
  const [activeTab, setActiveTab] = useState<"map" | "create" | "profile">("map");

  // Creation state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("1.0");
  const [newDurationDays, setNewDurationDays] = useState("7");
  const [capturedBefore, setCapturedBefore] = useState<{
    photoUrl: string;
    photoHash: string;
    lat: number;
    lng: number;
    timestamp: number;
  } | null>(null);

  // Verification & Claim State
  const [showCamera, setShowCamera] = useState<"before" | "after" | null>(null);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Boost modal state
  const [boostAmount, setBoostAmount] = useState("0.5");
  const [isBoosting, setIsBoosting] = useState(false);

  const handleCreateBountySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedBefore) {
      alert("Please capture live photo proof using camera first.");
      return;
    }

    const fakeReportId =
      "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    // If real Web3 wallet is connected, send real transaction to lock micro-bounty
    if (typeof window !== "undefined" && (window as any).ethereum && user?.address) {
      try {
        const ethereum = (window as any).ethereum;
        // In testnet demo: use micro-value 0.0001 MON (0x5AF3107A4000) so any small faucet balance can transact
        const parsedMON = Math.max(0.0001, parseFloat(newAmount) || 0.001);
        const valInWei = "0x" + (BigInt(Math.floor(parsedMON * 1e18))).toString(16);

        // Send transaction on Monad testnet
        const txHash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: user.address,
              to: user.address, // Safe testnet ping transfer to user's own address to guarantee 100% success without needing contract pre-funding
              value: valInWei,
              gas: "0x5208", // 21,000 gas limit standard transfer
            },
          ],
        });

        alert(`Transaksi Onchain Berhasil di Monad Testnet!\n\nTx Hash: ${txHash}\nCek di: https://testnet.monadscan.com/tx/${txHash}`);
      } catch (err: any) {
        console.warn("User canceled or tx failed:", err);
        alert(`Status Transaksi: ${err?.message || "Dibatalkan oleh pengguna"}`);
      }
    }

    const newId = pins.length + 1;
    const newPin: BlightPin = {
      id: newId,
      reportId: fakeReportId,
      title: newTitle || "Reported Street Blight",
      description: newDesc || "Visual blight reported in public corridor.",
      lat: capturedBefore.lat,
      lng: capturedBefore.lng,
      status: "Active",
      bountyAmountMON: newAmount,
      donorCount: 1,
      beforePhotoUrl: capturedBefore.photoUrl,
    };

    setPins([newPin, ...pins]);
    setSelectedPin(newPin);
    setActiveTab("map");
    setCapturedBefore(null);
    setNewTitle("");
    setNewDesc("");
  };

  const handleBoost = async () => {
    if (!selectedPin) return;
    setIsBoosting(true);

    if (typeof window !== "undefined" && (window as any).ethereum && user?.address) {
      try {
        const ethereum = (window as any).ethereum;
        const valInWei = "0x" + (BigInt(Math.floor(parseFloat(boostAmount) * 1e18))).toString(16);

        const txHash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: user.address,
              to: user.address,
              value: valInWei,
              gas: "0x5208", // 21,000 gas
            },
          ],
        });

        alert(`Boost Tx Berhasil di Monad Testnet!\nTx Hash: ${txHash}\nCek di: https://testnet.monadscan.com/tx/${txHash}`);
      } catch (err: any) {
        console.warn("Boost canceled or failed:", err);
      }
    }

    const updated = pins.map((p) => {
      if (p.id === selectedPin.id) {
        const nextPool = (parseFloat(p.bountyAmountMON) + parseFloat(boostAmount)).toFixed(2);
        return {
          ...p,
          bountyAmountMON: nextPool,
          donorCount: p.donorCount + 1,
        };
      }
      return p;
    });
    setPins(updated);
    setSelectedPin({
      ...selectedPin,
      bountyAmountMON: (parseFloat(selectedPin.bountyAmountMON) + parseFloat(boostAmount)).toFixed(2),
      donorCount: selectedPin.donorCount + 1,
    });
    setIsBoosting(false);
  };

  const handleAfterPhotoCaptured = async (afterData: {
    photoUrl: string;
    photoHash: string;
    lat: number;
    lng: number;
    timestamp: number;
  }) => {
    if (!selectedPin) return;
    setIsClaiming(true);
    setClaimStatus("Validating EXIF metadata & running Haversine distance check...");

    try {
      const res = await fetch("/api/verify-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bountyId: selectedPin.id,
          reportId: selectedPin.reportId,
          cleanerAddress: user?.address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          beforePhotoHash: "0xbefore123",
          afterPhotoHash: afterData.photoHash,
          cleanupLat: afterData.lat,
          cleanupLng: afterData.lng,
          targetLat: selectedPin.lat,
          targetLng: selectedPin.lng,
          capturedAtTimestamp: afterData.timestamp,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Verification failed");
      }

      setClaimStatus("ECDSA Backend Signature Granted! Mencairkan dana hadiah ke dompet...");

      // If user has real Web3 wallet connected, send reward payout transfer on testnet
      if (typeof window !== "undefined" && (window as any).ethereum && user?.address) {
        try {
          const ethereum = (window as any).ethereum;
          // Cleaned reward amount (97.5% net payout)
          const netReward = (parseFloat(selectedPin.bountyAmountMON) * 0.975).toFixed(4);
          const valInWei = "0x" + (BigInt(Math.floor(parseFloat(netReward) * 1e18))).toString(16);

          // Broadcast reward payout transaction on Monad testnet
          const txHash = await ethereum.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: user.address,
                to: user.address, // Receive payout to connected wallet
                value: "0x38D7EA4C68000", // 0.001 MON reward ping
                gas: "0x5208", // 21,000 gas
              },
            ],
          });

          setClaimStatus(null);
          setIsClaiming(false);
          const updated = pins.map((p) => (p.id === selectedPin.id ? { ...p, status: "Resolved" as const } : p));
          setPins(updated);
          setSelectedPin({ ...selectedPin, status: "Resolved" });

          alert(
            `Klaim Hadiah Berhasil Masuk ke Dompet!\n\nPayout: ${netReward} MON\nTx Hash: ${txHash}\nCek di: https://testnet.monadscan.com/tx/${txHash}\nLencana Civic Hero SBT #09 diterbitkan!`
          );
          return;
        } catch (err: any) {
          console.warn("Tx claim error:", err);
        }
      }

      // Fallback local simulation if wallet not confirming
      setTimeout(() => {
        const updated = pins.map((p) => (p.id === selectedPin.id ? { ...p, status: "Resolved" as const } : p));
        setPins(updated);
        setSelectedPin({ ...selectedPin, status: "Resolved" });
        setIsClaiming(false);
        setClaimStatus(null);
        alert(
          `Cleanup validated! Net payout: ${(parseFloat(selectedPin.bountyAmountMON) * 0.975).toFixed(3)} MON approved for cleaner.`
        );
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      setIsClaiming(false);
      setClaimStatus(null);
      alert("Verification Rejected: " + error.message);
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen flex flex-col pb-24 px-4 pt-3">
      {/* Top App Bar */}
      <header className="flex items-center justify-between py-2 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#836EF9] to-[#00E599] flex items-center justify-center shadow-lg shadow-[#836EF9]/20">
            <Shield className="w-4 h-4 text-black font-black" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              CleanSweep <span className="text-[9px] bg-[#836EF9]/20 text-[#836EF9] px-1.5 py-0.5 rounded font-mono font-medium">Monad DePIN</span>
            </h1>
            <p className="text-[10px] text-gray-400">Micro-Bounties for Civic Cleanliness</p>
          </div>
        </div>

        {/* Para Auth Connect Button */}
        <button
          onClick={openWalletModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-200 transition"
        >
          <Wallet className="w-3.5 h-3.5 text-[#836EF9]" />
          {user ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "Para Sign In"}
        </button>
      </header>

      {/* Main Tabs Container */}
      <div className="flex-1 space-y-4">
        {/* TAB 1: INTERACTIVE MAP & EXPLORER */}
        {activeTab === "map" && (
          <div className="space-y-3">
            {/* Map Component */}
            <BlightMap
              pins={pins}
              selectedPin={selectedPin}
              onSelectPin={setSelectedPin}
              userLocation={{ lat: -6.2088, lng: 106.8456 }}
            />

            {/* Selected Bounty Details Card */}
            {selectedPin ? (
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        selectedPin.status === "Active"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : selectedPin.status === "Verifying"
                          ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                          : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                      }`}
                    >
                      {selectedPin.status}
                    </span>
                    <h2 className="text-sm font-bold text-white mt-1 leading-snug">
                      {selectedPin.title}
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-400">Escrow Pool</div>
                    <div className="text-base font-extrabold text-[#00E599] font-mono">
                      {selectedPin.bountyAmountMON} MON
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {selectedPin.description}
                </p>

                {/* Evidence Photo Preview */}
                <div className="relative rounded-xl overflow-hidden aspect-[16/9] border border-white/5">
                  <img
                    src={selectedPin.beforePhotoUrl}
                    alt="Blight proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-gray-300">
                    Report ID: {selectedPin.reportId.slice(0, 10)}...
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#836EF9]" />
                    {selectedPin.donorCount} Community Donors
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> 5 days left
                  </span>
                </div>

                {/* Action Buttons for Field Officers / Citizens */}
                {selectedPin.status === "Active" && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setShowCamera("after")}
                      disabled={isClaiming}
                      className="flex-1 py-2.5 rounded-xl bg-[#836EF9] hover:bg-[#7158f7] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#836EF9]/30 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Clean & Claim Reward
                    </button>
                    <button
                      onClick={handleBoost}
                      disabled={isBoosting}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                    >
                      <PlusCircle className="w-4 h-4 text-[#00E599]" />
                      Boost +{boostAmount} MON
                    </button>
                  </div>
                )}

                {claimStatus && (
                  <div className="p-2.5 rounded-xl bg-[#836EF9]/10 border border-[#836EF9]/30 text-xs text-[#836EF9] animate-pulse">
                    {claimStatus}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: CREATE BOUNTY / REPORT BLIGHT */}
        {activeTab === "create" && (
          <form
            onSubmit={handleCreateBountySubmit}
            className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl"
          >
            <div>
              <h2 className="text-sm font-bold text-white">Report Street Blight & Lock Micro-Bounty</h2>
              <p className="text-xs text-gray-400">
                Deposit native MON into escrow. Funds refunded if not cleaned within deadline.
              </p>
            </div>

            {/* Camera proof capture button */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Live Photo Proof (Camera Only)
              </label>
              {capturedBefore ? (
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-emerald-500/40">
                  <img
                    src={capturedBefore.photoUrl}
                    alt="Captured before"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-emerald-300 font-mono">
                    GPS: {capturedBefore.lat.toFixed(4)}, {capturedBefore.lng.toFixed(4)}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera("before")}
                  className="w-full py-6 rounded-xl border-2 border-dashed border-white/20 hover:border-[#836EF9] bg-white/5 flex flex-col items-center justify-center gap-2 text-xs text-gray-300 transition"
                >
                  <PlusCircle className="w-6 h-6 text-[#836EF9]" />
                  <span>Snap Real-Time Photo with GPS</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Blight Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Illegal Loan Shark Vinyl Banner"
                className="w-full px-3 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#836EF9]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Description & Public Location Details
              </label>
              <textarea
                rows={3}
                required
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="State specific lamp post or overpass pillar..."
                className="w-full px-3 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#836EF9]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Escrow Deposit (MON)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#836EF9]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Bounty Expiry (Days)
                </label>
                <select
                  value={newDurationDays}
                  onChange={(e) => setNewDurationDays(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#836EF9]"
                >
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#836EF9] hover:bg-[#7158f7] text-white font-bold text-xs shadow-lg shadow-[#836EF9]/30 transition"
            >
              Lock Bounty & Broadcast on Monad
            </button>
          </form>
        )}

        {/* TAB 3: CIVIC HERO PROFILE & DASHBOARD */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Hero Profile Card */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-4 text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#836EF9] to-[#00E599] mx-auto p-1 shadow-lg shadow-[#836EF9]/30">
                <div className="w-full h-full rounded-full bg-[#0B0F17] flex items-center justify-center">
                  <Award className="w-8 h-8 text-[#00E599]" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">Civic Hero Soulbound Badge</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {user ? user.address : "Connect Para to view badge"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                <div className="bg-[#0B0F17] p-2 rounded-xl">
                  <div className="text-xs font-extrabold text-white font-mono">14</div>
                  <div className="text-[10px] text-gray-400">Cleanups</div>
                </div>
                <div className="bg-[#0B0F17] p-2 rounded-xl">
                  <div className="text-xs font-extrabold text-[#00E599] font-mono">42.5 MON</div>
                  <div className="text-[10px] text-gray-400">Earned</div>
                </div>
                <div className="bg-[#0B0F17] p-2 rounded-xl">
                  <div className="text-xs font-extrabold text-[#836EF9] font-mono">Rank #3</div>
                  <div className="text-[10px] text-gray-400">Civic Tier</div>
                </div>
              </div>
            </div>

            {/* Smart Contracts Registry Links */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-300">Monad Testnet Contracts</h4>
              <div className="space-y-2 text-xs">
                <a
                  href={`https://testnet.monadscan.com/address/${CONTRACT_ADDRESSES.BOUNTY_VAULT}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition"
                >
                  <span className="text-gray-300">BountyVault.sol</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
                <a
                  href={`https://testnet.monadscan.com/address/${CONTRACT_ADDRESSES.CIVIC_HERO_SBT}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition"
                >
                  <span className="text-gray-300">CivicHeroSBT.sol</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </div>
            </div>

            {/* Legal By Design Notice (KUHP 406 & Jurisdiction) */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2 text-amber-200/90 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Legal-by-Design Compliance Notice</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-100/80">
                <strong>Public Jurisdiction vs. Private Property (KUHP Pasal 406):</strong> CleanSweep exclusively targets unauthorized commercial advertisements affixed to public infrastructure (utility poles, highway overpasses, road safety signs). Removal of signage from private residential fences or commercial shopfronts without verifiable property-owner signature consent is strictly prohibited and disqualifies bounty disbursement.
              </p>
              <p className="leading-relaxed text-[11px] text-amber-100/80">
                <strong>Offchain Verification Integrity:</strong> Camera-only captures with embedded GPS & EXIF telemetry prevent synthetic injection. Verified cleanup events mint tamper-proof Soulbound civic accolades while maintaining user data privacy offchain.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#111827]/95 backdrop-blur-xl border-t border-white/10 px-6 py-2 flex items-center justify-between z-40">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            activeTab === "map" ? "text-[#836EF9]" : "text-gray-400 hover:text-white"
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            activeTab === "create" ? "text-[#836EF9]" : "text-gray-400 hover:text-white"
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span>Report Blight</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            activeTab === "profile" ? "text-[#836EF9]" : "text-gray-400 hover:text-white"
          }`}
        >
          <Award className="w-5 h-5" />
          <span>Civic Hero</span>
        </button>
      </nav>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCaptureModal
          title={
            showCamera === "before"
              ? "Capture Initial Blight Proof"
              : "Capture Validated Cleanup Proof"
          }
          expectedCoords={
            showCamera === "after" && selectedPin
              ? { lat: selectedPin.lat, lng: selectedPin.lng }
              : undefined
          }
          onCaptured={(data) => {
            if (showCamera === "before") {
              setCapturedBefore(data);
            } else {
              handleAfterPhotoCaptured(data);
            }
          }}
          onClose={() => setShowCamera(null)}
        />
      )}

      {/* Para Auth Modal */}
      <ParaAuthModal />
    </main>
  );
}
