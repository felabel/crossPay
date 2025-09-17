import type {
  Currency,
  Wallet,
  Transaction,
} from "./types";

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "BTC", name: "Bitcoin", symbol: "₿" },
];

export const initialWallets: Wallet[] = [
  {
    id: "w1",
    currency: currencies[0],
    balance: 12500.0,
    name: "Primary USD Account",
  },
  {
    id: "w2",
    currency: currencies[1],
    balance: 8000.0,
    name: "Vacation Fund (EUR)",
  },
  { id: "w3", currency: currencies[4], balance: 2.5, name: "Crypto Holdings" },
];

export const initialTransactions: Transaction[] = [];

// Dummy exchange rates for simulation
export const exchangeRates: { [key: string]: number } = {
  "USD-EUR": 0.93, "EUR-USD": 1.08,
  "USD-GBP": 0.79, "GBP-USD": 1.27,
  "USD-JPY": 157.0, "JPY-USD": 0.0064,
  "USD-BTC": 0.000015, "BTC-USD": 66000,
  "EUR-GBP": 0.85, "GBP-EUR": 1.18,
  "EUR-JPY": 169.0, "JPY-EUR": 0.0059,
  "EUR-BTC": 0.000016, "BTC-EUR": 62000,
  "GBP-JPY": 199.0, "JPY-GBP": 0.005,
  "GBP-BTC": 0.000019, "BTC-GBP": 52000,
  "JPY-BTC": 0.00000023, "BTC-JPY": 4300000,
};
