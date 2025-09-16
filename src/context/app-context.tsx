"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Wallet, Transaction } from "@/lib/types";
import { initialWallets, initialTransactions } from "@/lib/data";

interface AppContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  addWallet: (wallet: Omit<Wallet, "id">) => void;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => void;
  updateWalletBalance: (walletId: string, amount: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialTransactions
  );

  const addWallet = (wallet: Omit<Wallet, "id">) => {
    const newWallet = { ...wallet, id: `w${wallets.length + 1}` };
    setWallets((prev) => [...prev, newWallet]);
  };

  const addTransaction = (transaction: Omit<Transaction, "id" | "date">) => {
    const newTransaction = {
      ...transaction,
      id: `t${transactions.length + 1}`,
      date: new Date(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const updateWalletBalance = (walletId: string, amount: number) => {
    setWallets(wallets.map(w => w.id === walletId ? {...w, balance: w.balance + amount} : w));
  }

  return (
    <AppContext.Provider value={{ wallets, transactions, addWallet, addTransaction, updateWalletBalance }}>
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
