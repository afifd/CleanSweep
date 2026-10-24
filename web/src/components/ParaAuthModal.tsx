"use client";

import React, { useState } from "react";
import { useParaAuth } from "../app/providers";
import { KeyRound, Mail, Sparkles, X, Check, ShieldCheck } from "lucide-react";

export default function ParaAuthModal() {
  const { isModalOpen, closeModal, loginWithPara, user, logout } = useParaAuth();
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);

  if (!isModalOpen) return null;

  const handleSelect = async (method: "passkey" | "email" | "google") => {
    try {
      setLoadingMethod(method);
      await loginWithPara(method);
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111827] border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
        <button
          onClick={closeModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#836EF9]/20 border border-[#836EF9]/40 flex items-center justify-center mx-auto text-[#836EF9]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Para Authentication
          </h2>
          <p className="text-xs text-gray-400">
            Embedded MPC wallet for everyday citizens on Monad testnet
          </p>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="bg-[#1F2937] p-3 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> Connected
              </div>
              <p className="text-xs font-mono text-gray-300 break-all">
                {user.address}
              </p>
              <p className="text-[10px] text-gray-400">Method: {user.authMethod}</p>
            </div>
            <button
              onClick={logout}
              className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handleSelect("passkey")}
              disabled={!!loadingMethod}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-sm font-medium transition"
            >
              <span className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-[#836EF9]" />
                Connect MetaMask / Web3 Wallet
              </span>
              {loadingMethod === "passkey" ? (
                <span className="text-xs text-gray-400 animate-pulse">Connecting...</span>
              ) : (
                <Check className="w-4 h-4 text-transparent" />
              )}
            </button>

            <button
              onClick={() => handleSelect("email")}
              disabled={!!loadingMethod}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-sm font-medium transition"
            >
              <span className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-400" />
                Email OTP Sign-In
              </span>
              {loadingMethod === "email" ? (
                <span className="text-xs text-gray-400 animate-pulse">Sending OTP...</span>
              ) : (
                <Check className="w-4 h-4 text-transparent" />
              )}
            </button>

            <button
              onClick={() => handleSelect("google")}
              disabled={!!loadingMethod}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-sm font-medium transition"
            >
              <span className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Social Login (Google)
              </span>
              {loadingMethod === "google" ? (
                <span className="text-xs text-gray-400 animate-pulse">Connecting...</span>
              ) : (
                <Check className="w-4 h-4 text-transparent" />
              )}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-gray-400">
          Powered by Para MPC Enclave &middot; Non-custodial &middot; Monad 10,000 TPS
        </div>
      </div>
    </div>
  );
}
