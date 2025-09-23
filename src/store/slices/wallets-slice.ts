
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Wallet, Currency } from '@/lib/types';
import * as api from "@/services/api"; // Keep using the mock API for now

export interface WalletsState {
  wallets: Wallet[];
}

const initialState: WalletsState = {
  wallets: [],
};

let walletIdCounter = 1;

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    addWallet: (state, action: PayloadAction<{ name: string; currency: Currency; balance: number }>) => {
      const newWallet: Wallet = {
        id: `w${walletIdCounter++}`,
        ...action.payload,
      };
      state.wallets.push(newWallet);
    },
    updateWalletBalance: (state, action: PayloadAction<{ walletId: string; amount: number }>) => {
      const wallet = state.wallets.find(w => w.id === action.payload.walletId);
      if (wallet) {
        wallet.balance += action.payload.amount;
      }
    },
    performSwap: (state, action: PayloadAction<{ fromWalletId: string, toWalletId: string, fromAmount: number, receivedAmount: number }>) => {
        const { fromWalletId, toWalletId, fromAmount, receivedAmount } = action.payload;
        const fromWallet = state.wallets.find(w => w.id === fromWalletId);
        const toWallet = state.wallets.find(w => w.id === toWalletId);

        if (fromWallet && toWallet) {
            fromWallet.balance -= fromAmount;
            toWallet.balance += receivedAmount;
        }
    },
    performSend: (state, action: PayloadAction<{ fromWalletId: string, amount: number }>) => {
        const { fromWalletId, amount } = action.payload;
        const fromWallet = state.wallets.find(w => w.id === fromWalletId);
        if (fromWallet) {
            fromWallet.balance -= amount;
        }
    }
  },
});

export const { addWallet, updateWalletBalance, performSwap, performSend } = walletsSlice.actions;

export default walletsSlice.reducer;
