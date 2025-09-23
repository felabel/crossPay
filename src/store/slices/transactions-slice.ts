
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Transaction } from '@/lib/types';

export interface TransactionsState {
  transactions: Transaction[];
}

const initialState: TransactionsState = {
  transactions: [],
};

let transactionIdCounter = 1;

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Omit<Transaction, 'id' | 'date'>>) => {
      const newTransaction: Transaction = {
        id: `t${transactionIdCounter++}`,
        date: new Date().toISOString(),
        ...action.payload,
      };
      // Add to the beginning of the array
      state.transactions.unshift(newTransaction);
    },
  },
});

export const { addTransaction } = transactionsSlice.actions;

export default transactionsSlice.reducer;
