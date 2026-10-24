"use client";

import React, { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export interface ParaUser {
  address: `0x${string}`;
  email?: string;
  authMethod: "passkey" | "email" | "google" | "external";
}

interface ParaAuthContextType {
  user: ParaUser | null;
  isConnected: boolean;
  loginWithPara: (method: "passkey" | "email" | "google") => Promise<void>;
  logout: () => void;
  openWalletModal: () => void;
  isModalOpen: boolean;
  closeModal: () => void;
}

const ParaAuthContext = createContext<ParaAuthContextType>({
  user: null,
  isConnected: false,
  loginWithPara: async () => {},
  logout: () => {},
  openWalletModal: () => {},
  isModalOpen: false,
  closeModal: () => {},
});

export const useParaAuth = () => useContext(ParaAuthContext);

// Monad Testnet config with explicit tight gas
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ParaUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check local session
    const stored = localStorage.getItem("cleansweep_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("cleansweep_user");
      }
    }
  }, []);

  const loginWithPara = async (method: "passkey" | "email" | "google") => {
    // Para embedded MPC simulation or SDK connect
    let mockAddr: `0x${string}`;
    if (method === "passkey") {
      mockAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    } else if (method === "email") {
      mockAddr = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    } else {
      mockAddr = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
    }

    const newUser: ParaUser = {
      address: mockAddr,
      email: method === "email" ? "citizen@civic.id" : undefined,
      authMethod: method,
    };
    setUser(newUser);
    localStorage.setItem("cleansweep_user", JSON.stringify(newUser));
    setIsModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cleansweep_user");
  };

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ParaAuthContext.Provider
          value={{
            user,
            isConnected: !!user,
            loginWithPara,
            logout,
            openWalletModal: () => setIsModalOpen(true),
            isModalOpen,
            closeModal: () => setIsModalOpen(false),
          }}
        >
          {children}
        </ParaAuthContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
