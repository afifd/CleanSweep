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
    let mockAddr: `0x${string}`;

    // If browser has window.ethereum (MetaMask/Rabby), auto-switch/add Monad Testnet and connect
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum;

        // Auto request switch to Monad Testnet (Chain ID 10143 / 0x279f)
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x279f" }],
          });
        } catch (switchError: any) {
          // Error 4902 means the chain has not been added to MetaMask yet
          if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x279f",
                  chainName: "Monad Testnet",
                  nativeCurrency: {
                    name: "Monad",
                    symbol: "MON",
                    decimals: 18,
                  },
                  rpcUrls: ["https://testnet-rpc.monad.xyz"],
                  blockExplorerUrls: ["https://testnet.monadscan.com"],
                },
              ],
            });
          }
        }

        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts.length > 0) {
          mockAddr = accounts[0];
          const newUser: ParaUser = {
            address: mockAddr,
            email: undefined,
            authMethod: "external",
          };
          setUser(newUser);
          localStorage.setItem("cleansweep_user", JSON.stringify(newUser));
          setIsModalOpen(false);
          return;
        }
      } catch (err) {
        console.warn("User rejected Web3 connect, fallback to embedded MPC wallet", err);
      }
    }

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
