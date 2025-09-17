"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import type { Wallet, Transaction, Currency } from "@/lib/types";
import * as api from "@/services/api";
import { currencies } from "@/lib/data";

export type LiveRates = Record<string, number>;

interface AppContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  exchangeRates: LiveRates | null;
  addWallet: (wallet: Omit<Wallet, "id">) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => Promise<void>;
  updateWalletBalance: (walletId: string, amount: number) => Promise<void>;
  swapCurrency: (args: { fromWalletId: string; toWalletId: string; amount: number; }) => Promise<void>;
  sendFunds: (args: { fromWalletId: string; toWalletId: string; amount: number; description: string; }) => Promise<void>;
  refreshRates: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exchangeRates, setExchangeRates] = useState<LiveRates | null>(null);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id" | "date">) => {
     const newTransaction = await api.createTransaction(transaction);
     setTransactions((prev) => [newTransaction, ...prev]);
  }, []);

  const refreshRates = useCallback(async () => {
    try {
      // Fetch base rates from the live API (base is USD)
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data = await response.json();
      const baseRates = data.rates as Record<string, number>;

      // Create the full matrix of currency pairs that the app expects
      const allRates: LiveRates = {};
      const allCurrencies = currencies.map(c => c.code);

      for (const from of allCurrencies) {
        for (const to of allCurrencies) {
          if (from === to) continue;
          // Example: to convert from EUR to JPY: (amount * base_usd_to_jpy) / base_usd_to_eur
          const fromRate = baseRates[from] || 1; // Default to 1 if currency is USD itself
          const toRate = baseRates[to] || 1;
          if (fromRate && toRate) {
             if (from === 'USD') {
                allRates[`${from}-${to}`] = toRate;
             } else {
                allRates[`${from}-${to}`] = toRate / fromRate;
             }
          }
        }
      }
      
      setExchangeRates(allRates);
      api.setLiveRates(allRates); // Pass the live rates to the mock API service

    } catch (error) {
      console.error("Failed to fetch live exchange rates:", error);
      // Optionally set a toast or notification for the user
    }
  }, []);


  useEffect(() => {
    // Fetch initial rates on load
    refreshRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addWallet = async (wallet: Omit<Wallet, "id">) => {
    const newWallet = await api.createWallet(wallet);
    setWallets((prev) => [...prev, newWallet]);
     if (wallet.balance > 0) {
      await addTransaction({
        walletId: newWallet.id,
        amount: wallet.balance,
        type: 'Deposit',
        status: 'Completed',
        description: 'Initial balance'
      });
    }
  };

  const updateWalletBalance = async (walletId: string, amount: number) => {
    await api.depositFunds({ walletId, amount });
    setWallets(wallets.map(w => w.id === walletId ? {...w, balance: w.balance + amount} : w));
  }

  const swapCurrency = async (args: { fromWalletId: string; toWalletId: string; amount: number; }) => {
    // Ensure latest rates are used for swap
    await refreshRates();

    const { fromWallet, toWallet, receivedAmount } = await api.swapCurrency(args);
    setWallets(currentWallets => currentWallets.map(w => {
      if (w.id === fromWallet.id) return fromWallet;
      if (w.id === toWallet.id) return toWallet;
      return w;
    }));
    await addTransaction({
      walletId: fromWallet.id,
      amount: -args.amount,
      type: 'Swap',
      status: 'Completed',
      description: `Swap to ${toWallet.currency.code}`
    });
     await addTransaction({
      walletId: toWallet.id,
      amount: receivedAmount,
      type: 'Swap',
      status: 'Completed',
      description: `Swap from ${fromWallet.currency.code}`
    });
  };

  const sendFunds = async (args: { fromWalletId: string; toWalletId: string; amount: number; description: string; }) => {
    const { fromWallet } = await api.sendFunds(args);
     setWallets(currentWallets => currentWallets.map(w => {
      if (w.id === fromWallet.id) return fromWallet;
      return w;
    }));
    await addTransaction({
      walletId: fromWallet.id,
      amount: -args.amount,
      type: 'Transfer',
      status: 'Completed',
      description: args.description
    });
  }


  return (
    <AppContext.Provider value={{ wallets, transactions, exchangeRates, addWallet, addTransaction, updateWalletBalance, swapCurrency, sendFunds, refreshRates }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
