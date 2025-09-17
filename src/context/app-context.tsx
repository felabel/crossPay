"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import type { Wallet, Transaction, Currency } from "@/lib/types";
import { initialWallets } from "@/lib/data";
import * as api from "@/services/api";
import { getLiveRates, GetLiveRatesOutput } from "@/ai/flows/live-exchange-rate-flow";
import { currencies } from "@/lib/data";

interface AppContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  exchangeRates: GetLiveRatesOutput | null;
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
  const [exchangeRates, setExchangeRates] = useState<GetLiveRatesOutput | null>(null);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id" | "date">) => {
     const newTransaction = await api.createTransaction(transaction);
     setTransactions((prev) => [newTransaction, ...prev]);
  }, []);

  const refreshRates = useCallback(async () => {
    try {
      const allCurrencies = currencies.map(c => c.code);
      const rates = await getLiveRates({ currencies: allCurrencies });
      setExchangeRates(rates);
    } catch (error) {
      console.error("Failed to fetch live exchange rates:", error);
      // Optionally set a toast or notification for the user
    }
  }, []);


  useEffect(() => {
    const initializeAppData = async () => {
      const createdWallets: Wallet[] = [];
      for (const wallet of initialWallets) {
          const newWallet = await api.createWallet(wallet);
          createdWallets.push(newWallet);
          if (newWallet.balance > 0) {
            // Use the addTransaction function to ensure transactions are added correctly
            await addTransaction({
              walletId: newWallet.id,
              amount: newWallet.balance,
              type: 'Deposit',
              status: 'Completed',
              description: 'Initial balance'
            });
          }
      }
      setWallets(createdWallets);
      await refreshRates();
    };

    initializeAppData();
  }, [addTransaction, refreshRates]);

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
    // Refresh rates after a swap for the most up-to-date values
    await refreshRates();
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
