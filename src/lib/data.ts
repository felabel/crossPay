import type {
  Currency,
  Transaction,
} from "./types";

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "BTC", name: "Bitcoin", symbol: "₿" },
];

export const initialTransactions: Transaction[] = [];
