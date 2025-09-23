
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ratesReducer, { fetchExchangeRates, RatesState } from './rates-slice';
import { currencies } from '@/lib/data';

// Mock the global fetch
global.fetch = vi.fn();

const createFetchResponse = (ok: boolean, data: any) => {
  return { ok, json: () => new Promise((resolve) => resolve(data)) };
};

describe('rates slice', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const initialState: RatesState = {
    rates: null,
    status: 'idle',
    error: null,
  };

  it('should handle initial state', () => {
    expect(ratesReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle fetchExchangeRates.pending', () => {
    const action = { type: fetchExchangeRates.pending.type };
    const state = ratesReducer(initialState, action);
    expect(state.status).toBe('loading');
  });

  it('should handle fetchExchangeRates.fulfilled', () => {
    const mockRates = { 'USD-EUR': 0.9, 'EUR-USD': 1.11 };
    const action = { type: fetchExchangeRates.fulfilled.type, payload: mockRates };
    const state = ratesReducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.rates).toEqual(mockRates);
  });

  it('should handle fetchExchangeRates.rejected', () => {
    const action = { type: fetchExchangeRates.rejected.type, payload: 'Failed to fetch' };
    const state = ratesReducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Failed to fetch');
  });
  
  it('fetchExchangeRates should create the correct matrix', async () => {
    const mockFiatRates = { rates: { EUR: 0.9, GBP: 0.8, JPY: 150 } };
    const mockCryptoRates = { bitcoin: { usd: 50000 } };
    
    (fetch as any)
      .mockImplementation((url: string) => {
        if (url.includes("open.er-api.com")) {
          return Promise.resolve(createFetchResponse(true, mockFiatRates));
        }
        if (url.includes("api.coingecko.com")) {
          return Promise.resolve(createFetchResponse(true, mockCryptoRates));
        }
        return Promise.reject(new Error(`Unknown URL: ${url}`));
      });

    const dispatch = vi.fn();
    const thunk = fetchExchangeRates();
    const result = await thunk(dispatch, () => {}, undefined);

    const rates = result.payload as Record<string, number>;
    
    // Check some key conversions
    expect(rates['USD-EUR']).toBeCloseTo(0.9);
    expect(rates['EUR-USD']).toBeCloseTo(1 / 0.9);
    expect(rates['BTC-USD']).toBe(50000);
    expect(rates['USD-BTC']).toBeCloseTo(1 / 50000);
    expect(rates['BTC-EUR']).toBeCloseTo(50000 * 0.9);
    expect(rates['GBP-JPY']).toBeCloseTo(150 / 0.8);
    expect(rates['JPY-GBP']).toBeCloseTo(0.8 / 150);
  });
});
