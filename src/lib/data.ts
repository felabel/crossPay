import type {
  Currency,
} from "./types";

export const currencies: Currency[] = [
  { id: "usd", code: "USD", name: "US Dollar", symbol: "$" },
  { id: "eur", code: "EUR", name: "Euro", symbol: "€" },
  { id: "jpy", code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { id: "gbp", code: "GBP", name: "British Pound", symbol: "£" },
  { id: "bitcoin", code: "BTC", name: "Bitcoin", symbol: "₿", isCrypto: true },
];
