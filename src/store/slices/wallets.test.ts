
import { describe, it, expect } from 'vitest';
import walletsReducer, { addWallet, updateWalletBalance, performSwap, performSend, WalletsState } from './wallets-slice';
import { currencies } from '@/lib/data';

describe('wallets slice', () => {
  const initialState: WalletsState = {
    wallets: [],
  };

  it('should handle initial state', () => {
    expect(walletsReducer(undefined, { type: 'unknown' })).toEqual({
      wallets: [],
    });
  });

  it('should handle addWallet', () => {
    const usdCurrency = currencies.find(c => c.code === 'USD');
    const actual = walletsReducer(initialState, addWallet({ name: 'My USD Wallet', currency: usdCurrency!, balance: 100 }));
    expect(actual.wallets.length).toBe(1);
    expect(actual.wallets[0].name).toBe('My USD Wallet');
    expect(actual.wallets[0].balance).toBe(100);
    expect(actual.wallets[0].currency.code).toBe('USD');
  });

  it('should handle updateWalletBalance for deposit', () => {
    const stateWithWallet: WalletsState = {
      wallets: [{ id: 'w1', name: 'Test Wallet', currency: currencies.find(c => c.code === 'USD')!, balance: 100 }],
    };
    const actual = walletsReducer(stateWithWallet, updateWalletBalance({ walletId: 'w1', amount: 50 }));
    expect(actual.wallets[0].balance).toBe(150);
  });

  it('should handle updateWalletBalance for withdrawal', () => {
    const stateWithWallet: WalletsState = {
      wallets: [{ id: 'w1', name: 'Test Wallet', currency: currencies.find(c => c.code === 'USD')!, balance: 100 }],
    };
    const actual = walletsReducer(stateWithWallet, updateWalletBalance({ walletId: 'w1', amount: -50 }));
    expect(actual.wallets[0].balance).toBe(50);
  });

  it('should handle performSwap', () => {
    const stateWithWallets: WalletsState = {
      wallets: [
        { id: 'w1', name: 'USD Wallet', currency: currencies.find(c => c.code === 'USD')!, balance: 200 },
        { id: 'w2', name: 'EUR Wallet', currency: currencies.find(c => c.code === 'EUR')!, balance: 100 },
      ],
    };
    const actual = walletsReducer(stateWithWallets, performSwap({ fromWalletId: 'w1', toWalletId: 'w2', fromAmount: 50, receivedAmount: 45 }));
    expect(actual.wallets.find(w => w.id === 'w1')?.balance).toBe(150);
    expect(actual.wallets.find(w => w.id === 'w2')?.balance).toBe(145);
  });

   it('should handle performSend', () => {
    const stateWithWallet: WalletsState = {
      wallets: [{ id: 'w1', name: 'Test Wallet', currency: currencies.find(c => c.code === 'USD')!, balance: 100 }],
    };
    const actual = walletsReducer(stateWithWallet, performSend({ fromWalletId: 'w1', amount: 30 }));
    expect(actual.wallets[0].balance).toBe(70);
  });

});
