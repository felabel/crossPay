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
