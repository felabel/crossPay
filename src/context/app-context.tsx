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
      const allCurrencies = currencies.map(c => c.code);
      const cryptoCurrencies = currencies.filter(c => c.isCrypto).map(c => c.id);

      // 1. Fetch base rates for FIAT currencies from ER-API (base is USD)
      const fiatResponse = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!fiatResponse.ok) throw new Error('Failed to fetch fiat exchange rates');
      const fiatData = await fiatResponse.json();
      const baseFiatRates = fiatData.rates as Record<string, number>;
      baseFiatRates['USD'] = 1; // Add USD to itself

      // 2. Fetch rates for CRYPTO currencies from CoinGecko (base is USD)
      let cryptoRatesInUSD: Record<string, number> = {};
      if (cryptoCurrencies.length > 0) {
        const cryptoResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoCurrencies.join(',')}&vs_currencies=usd`);
        if (!cryptoResponse.ok) throw new Error('Failed to fetch crypto exchange rates');
        const cryptoData = await cryptoResponse.json();
        cryptoRatesInUSD = Object.keys(cryptoData).reduce((acc, key) => {
            const currency = currencies.find(c => c.id === key);
            if (currency) {
                acc[currency.code] = cryptoData[key].usd;
            }
            return acc;
        }, {} as Record<string, number>);
      }

      // 3. Merge all rates into a single object with USD as the base
      const allRatesInUSD = { ...baseFiatRates, ...cryptoRatesInUSD };
      
      // 4. Create the full matrix of all currency pairs
      const allRates: LiveRates = {};
      for (const from of allCurrencies) {
        for (const to of allCurrencies) {
          if (from === to) {
            allRates[`${from}-${to}`] = 1;
            continue;
          };
          const fromRate = allRatesInUSD[from];
          const toRate = allRatesInUSD[to];
          
          if (fromRate && toRate) {
             allRates[`${from}-${to}`] = toRate / fromRate;
          }
        }
      }
      
      setExchangeRates(allRates);
      api.setLiveRates(allRates);

    } catch (error) {
      console.error("Failed to fetch live exchange rates:", error);
    }
  }, []);


  useEffect(() => {
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
