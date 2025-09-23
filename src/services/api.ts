// This file mocks a remote API.
import type { Wallet, Transaction } from "@/lib/types";
// In-memory "database"
let wallets: Wallet[] =  loadWalletsFromStorage();
let transactionIdCounter = 1;
let walletIdCounter = 1;

function saveWalletsToStorage() {
  localStorage.setItem("wallets", JSON.stringify(wallets));
}

function loadWalletsFromStorage(): Wallet[] {
  try {
    const stored = localStorage.getItem("wallets");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getWallets(): Wallet[] {
  return wallets;
}

// This will be populated by the context with live data
let liveExchangeRates: Record<string, number> | null = null;

const randomDelay = () => new Promise(res => setTimeout(res, Math.random() * 1000 + 500));
const shouldFail = () => Math.random() < 0.1; // 10% chance of failure

export function setLiveRates(rates: Record<string, number>) {
  liveExchangeRates = rates;
}

export async function createWallet(walletData: Omit<Wallet, 'id'>): Promise<Wallet> {
  await randomDelay();
  if (shouldFail()) {
    throw new Error("Failed to create wallet on the server.");
  }
  const newWallet: Wallet = {
    ...walletData,
    id: `w${walletIdCounter++}`,
  };
  wallets.push(newWallet);
    saveWalletsToStorage();
  return newWallet;
}

export async function depositFunds({ walletId, amount }: { walletId: string; amount: number }): Promise<Wallet> {
  await randomDelay();
  // Deposits always succeed
  const wallet = wallets.find(w => w.id === walletId);
  if (!wallet) {
    throw new Error("Wallet not found.");
  }
  wallet.balance += amount;
    saveWalletsToStorage();
  return { ...wallet };
}

export async function swapCurrency({ fromWalletId, toWalletId, amount }: { fromWalletId: string; toWalletId: string; amount: number; }): Promise<{ fromWallet: Wallet, toWallet: Wallet, receivedAmount: number }> {
    await randomDelay();
    console.log("from wallet", fromWalletId, "to wallet", toWalletId, "amount", amount, "live rates", liveExchangeRates);

    console.log("all wallers", wallets);
    // if (shouldFail()) {
    //     throw new Error("Currency swap failed due to a network error.");
    // }

    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);


    if (!fromWallet || !toWallet) {
        throw new Error("One or both wallets not found.");
    }

    if (fromWallet.balance < amount) {
        throw new Error("Insufficient funds for the swap.");
    }

    if (!liveExchangeRates) {
        throw new Error("Exchange rates have not been loaded yet.");
    }

    const rateKey = `${fromWallet.currency.code}-${toWallet.currency.code}`;
    const rate = liveExchangeRates[rateKey];

    if (!rate) {
        throw new Error(`Exchange rate not available for ${fromWallet.currency.code} to ${toWallet.currency.code}.`);
    }

    const receivedAmount = amount * rate;
    fromWallet.balance -= amount;
    toWallet.balance += receivedAmount;

    return { fromWallet: { ...fromWallet }, toWallet: { ...toWallet }, receivedAmount };
}

export async function sendFunds({ fromWalletId, toWalletId, amount }: { fromWalletId: string; toWalletId: string; amount: number; }): Promise<{ fromWallet: Wallet }> {
    await randomDelay();

    const fromWallet = wallets.find(w => w.id === fromWalletId);

    if (!fromWallet) {
        throw new Error("Source wallet not found.");
    }
     if (fromWallet.balance < amount) {
        throw new Error("Insufficient funds to send.");
    }
    
    if (shouldFail()) {
        throw new Error("Transfer failed due to a server issue.");
    }
    
    fromWallet.balance -= amount;
    
    // In a real app, the recipient's wallet would be updated.
    // For this mock,  only care about the sender's balance changing.

    return { fromWallet: { ...fromWallet } };
}

export async function createTransaction(txData: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> {
    await randomDelay();
    const newTransaction: Transaction = {
        ...txData,
        id: `t${transactionIdCounter++}`,
        date: new Date().toISOString(),
    };
    return newTransaction;
}
