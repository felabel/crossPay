
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import transactionsReducer, { addTransaction, TransactionsState } from './transactions-slice';

describe('transactions slice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  
  const initialState: TransactionsState = {
    transactions: [],
  };

  it('should handle initial state', () => {
    expect(transactionsReducer(undefined, { type: 'unknown' })).toEqual({
      transactions: [],
    });
  });

  it('should handle addTransaction and prepend it to the list', () => {
    const firstTransaction = {
      walletId: 'w1',
      amount: 100,
      type: 'Deposit' as const,
      status: 'Completed' as const,
      description: 'Initial Deposit',
    };
    const firstState = transactionsReducer(initialState, addTransaction(firstTransaction));

    expect(firstState.transactions.length).toBe(1);
    expect(firstState.transactions[0].amount).toBe(100);
    expect(firstState.transactions[0].id).toBeDefined();
    expect(firstState.transactions[0].date).toBe('2024-01-01T12:00:00.000Z');

    const secondTransaction = {
      walletId: 'w2',
      amount: -50,
      type: 'Transfer' as const,
      status: 'Completed' as const,
      description: 'Sent money',
    };
    const secondState = transactionsReducer(firstState, addTransaction(secondTransaction));

    expect(secondState.transactions.length).toBe(2);
    expect(secondState.transactions[0].amount).toBe(-50);
    expect(secondState.transactions[1].amount).toBe(100);
  });
});
