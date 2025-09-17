"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Wallet, Transaction, Currency } from "@/lib/types";
import { initialWallets, initialTransactions } from "@/lib/data";
import * as api from "@/services/api";

interface AppContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  addWallet: (wallet: Omit<Wallet, "id">) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => Promise<void>;
  updateWalletBalance: (walletId: string, amount: number) => Promise<void>;
  swapCurrency: (args: { fromWalletId: string; toWalletId: string; amount: number; }) => Promise<void>;
  sendFunds: (args: { fromWalletId: string; toWalletId: string; amount: number; description: string; }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialTransactions
  );

  const addWallet = async (wallet: Omit<Wallet, "id">) => {
    const newWallet = await api.createWallet(wallet);
    setWallets((prev) => [...prev, newWallet]);
  };

  const addTransaction = async (transaction: Omit<Transaction, "id" | "date">) => {
     const newTransaction = await api.createTransaction(transaction);
     setTransactions((prev) => [newTransaction, ...prev]);
  };

  const updateWalletBalance = async (walletId: string, amount: number) => {
    await api.depositFunds({ walletId, amount });
    setWallets(wallets.map(w => w.id === walletId ? {...w, balance: w.balance + amount} : w));
  }

  const swapCurrency = async (args: { fromWalletId: string; toWalletId: string; amount: number; }) => {
    const { fromWallet, toWallet } = await api.swapCurrency(args);
    setWallets(currentWallets => currentWallets.map(w => {
      if (w.id === fromWallet.id) return fromWallet;
      if (w.id === toWallet.id) return toWallet;
      return w;
    }));
    // Add transactions for the swap
    await addTransaction({
      walletId: fromWallet.id,
      amount: -args.amount,
      type: 'Swap',
      status: 'Completed',
      description: `Swap to ${toWallet.currency.code}`
    });
     await addTransaction({
      walletId: toWallet.id,
      amount: toWallet.balance - (wallets.find(w => w.id === toWallet.id)?.balance || 0),
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
    <AppContext.Provider value={{ wallets, transactions, addWallet, addTransaction, updateWalletBalance, swapCurrency, sendFunds }}>
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
