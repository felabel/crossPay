import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { currencies } from '@/lib/data';
import type { LiveRates } from '@/lib/types';

export const fetchExchangeRates = createAsyncThunk(
  'rates/fetchExchangeRates',
  async (_, { rejectWithValue }) => {
    try {
      const allCurrencyCodes = currencies.map((c) => c.code);
      const cryptoCurrencies = currencies.filter((c) => c.isCrypto).map((c) => c.id);

      // 1. Fiat (base USD)
      const fiatResponse = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!fiatResponse.ok) throw new Error("Failed to fetch fiat rates");
      const fiatData = await fiatResponse.json();
      const rawRates = fiatData.rates as Record<string, number>;

      // Invert: API = units per 1 USD → 
      const fiatRatesInUSD: Record<string, number> = {};
      for (const [code, value] of Object.entries(rawRates)) {
        if (value && value > 0) {
          fiatRatesInUSD[code] = 1 / value;
        }
      }
      fiatRatesInUSD["USD"] = 1;

      // 2. Crypto (base USD → already USD per unit)
      let cryptoRatesInUSD: Record<string, number> = {};
      if (cryptoCurrencies.length > 0) {
        const cryptoResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoCurrencies.join(",")}&vs_currencies=usd`
        );
        if (!cryptoResponse.ok) throw new Error("Failed to fetch crypto rates");
        const cryptoData = await cryptoResponse.json();
        cryptoRatesInUSD = Object.keys(cryptoData).reduce((acc, key) => {
          const currency = currencies.find((c) => c.id === key);
          if (currency) acc[currency.code] = cryptoData[key].usd;
          return acc;
        }, {} as Record<string, number>);
      }

      // 3. Merge
      const allRatesInUSD = { ...fiatRatesInUSD, ...cryptoRatesInUSD };

      // 4. Build matrix
      const allRates: LiveRates = {};
      for (const from of allCurrencyCodes) {
        for (const to of allCurrencyCodes) {
          const fromUSD = allRatesInUSD[from];
          const toUSD = allRatesInUSD[to];
          if (fromUSD && toUSD) {
            allRates[`${from}-${to}`] = fromUSD / toUSD;
          }
        }
      }
      return allRates;
    } catch (err: any) {
      console.error("Failed to fetch live exchange rates:", err);
      return rejectWithValue(err.message);
    }
  }
);

export interface RatesState {
  rates: LiveRates | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: RatesState = {
  rates: null,
  status: 'idle',
  error: null,
};

const ratesSlice = createSlice({
  name: 'rates',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExchangeRates.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchExchangeRates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rates = action.payload;
      })
      .addCase(fetchExchangeRates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default ratesSlice.reducer;
