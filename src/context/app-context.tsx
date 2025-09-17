"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import type { Wallet, Transaction } from "@/lib/types";
import * as api from "@/services/api";
import { currencies } from "@/lib/data";

export type LiveRates = Record<string, number>;

interface AppContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  exchangeRates: LiveRates | null;
  addWallet: (wallet: Omit<Wallet, "id">) => Promise<void>;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "date">
  ) => Promise<void>;
  updateWalletBalance: (walletId: string, amount: number) => Promise<void>;
  swapCurrency: (args: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
  }) => Promise<void>;
  sendFunds: (args: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    description: string;
  }) => Promise<void>;
  refreshRates: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ---- LocalStorage helpers ----
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      if (key === "transactions") {
        return JSON.parse(item, (k, v) => {
          if (k === "date") return new Date(v);
          return v;
        });
      }
      return JSON.parse(item);
    }
  } catch (err) {
    console.error(`Error reading "${key}" from localStorage:`, err);
  }
  return defaultValue;
};

const saveToStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing "${key}" to localStorage:`, err);
  }
};

// ---- Provider ----
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [wallets, setWallets] = useState<Wallet[]>(() =>
    loadFromStorage("wallets", [])
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage("transactions", [])
  );
  const [exchangeRates, setExchangeRates] = useState<LiveRates | null>(null);

  // persist to localStorage
  useEffect(() => {
    saveToStorage("wallets", wallets);
  }, [wallets]);
  useEffect(() => {
    saveToStorage("transactions", transactions);
  }, [transactions]);

  // ---- Transactions ----
  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, "id" | "date">) => {
      const newTx = await api.createTransaction(transaction);
      setTransactions((prev) => [newTx, ...prev]);
    },
    []
  );

  // ---- Rates ----
  const refreshRates = useCallback(async () => {
    try {
      const allCurrencyCodes = currencies.map((c) => c.code);
      const cryptoCurrencies = currencies
        .filter((c) => c.isCrypto)
        .map((c) => c.id);

      // 1. Fiat (base USD)
      const fiatResponse = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!fiatResponse.ok) throw new Error("Failed to fetch fiat rates");
      const fiatData = await fiatResponse.json();
      const baseFiatRates = fiatData.rates as Record<string, number>;
      baseFiatRates["USD"] = 1;

      // 2. Crypto (base USD)
      let cryptoRatesInUSD: Record<string, number> = {};
      if (cryptoCurrencies.length > 0) {
        const cryptoResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoCurrencies.join(
            ","
          )}&vs_currencies=usd`
        );
        if (!cryptoResponse.ok)
          throw new Error("Failed to fetch crypto rates");
        const cryptoData = await cryptoResponse.json();
        cryptoRatesInUSD = Object.keys(cryptoData).reduce((acc, key) => {
          const currency = currencies.find((c) => c.id === key);
          if (currency) acc[currency.code] = cryptoData[key].usd;
          return acc;
        }, {} as Record<string, number>);
      }

      // 3. Merge
      const allRatesInUSD = { ...baseFiatRates, ...cryptoRatesInUSD };

      // 4. Build matrix
      const allRates: LiveRates = {};
      for (const from of allCurrencyCodes) {
        for (const to of allCurrencyCodes) {
          const fromRateUSD = allRatesInUSD[from];
          const toRateUSD = allRatesInUSD[to];
          if (fromRateUSD && toRateUSD) {
            allRates[`${from}-${to}`] = toRateUSD / fromRateUSD;
          }
        }
      }

      setExchangeRates(allRates);
      api.setLiveRates(allRates);
    } catch (err) {
      console.error("Failed to fetch live exchange rates:", err);
    }
  }, []);

  useEffect(() => {
    refreshRates();
    const id = setInterval(refreshRates, 300_000);
    return () => clearInterval(id);
  }, [refreshRates]);

  // ---- Wallets ----
  const addWallet = async (wallet: Omit<Wallet, "id">) => {
    const newWallet = await api.createWallet(wallet);
    setWallets((prev) => [...prev, newWallet]);

    // if initial balance
    if (wallet.balance > 0) {
      await addTransaction({
        walletId: newWallet.id, // safe because api.createWallet must return id
        amount: wallet.balance,
        type: "Deposit",
        status: "Completed",
        description: "Initial balance",
      });
    }
  };

  const updateWalletBalance = async (walletId: string, amount: number) => {
    await api.depositFunds({ walletId, amount });
    setWallets((prev) =>
      prev.map((w) =>
        w.id === walletId ? { ...w, balance: w.balance + amount } : w
      )
    );
  };

  const swapCurrency = async (args: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
  }) => {
    await refreshRates();
    const result = await api.swapCurrency(args);
    if (!result) return;

    const { fromWallet, toWallet, receivedAmount } = result;
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === fromWallet.id) return fromWallet;
        if (w.id === toWallet.id) return toWallet;
        return w;
      })
    );

    await addTransaction({
      walletId: fromWallet.id,
      amount: -args.amount,
      type: "Swap",
      status: "Completed",
      description: `Swap to ${toWallet.currency.code}`,
    });
    await addTransaction({
      walletId: toWallet.id,
      amount: receivedAmount,
      type: "Swap",
      status: "Completed",
      description: `Swap from ${fromWallet.currency.code}`,
    });
  };

  const sendFunds = async (args: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    description: string;
  }) => {
    const result = await api.sendFunds(args);
    if (!result) return;

    const { fromWallet } = result;
    setWallets((prev) =>
      prev.map((w) => (w.id === fromWallet.id ? fromWallet : w))
    );
    await addTransaction({
      walletId: fromWallet.id,
      amount: -args.amount,
      type: "Transfer",
      status: "Completed",
      description: args.description,
    });
  };

  return (
    <AppContext.Provider
      value={{
        wallets,
        transactions,
        exchangeRates,
        addWallet,
        addTransaction,
        updateWalletBalance,
        swapCurrency,
        sendFunds,
        refreshRates,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
};
