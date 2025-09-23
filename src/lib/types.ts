
export type Currency = {
  id: string; // Used for API calls, e.g., 'bitcoin'
  code: string; // e.g., 'BTC'
  name: string; // e.g., 'Bitcoin'
  symbol: string;
  isCrypto?: boolean;
};

export type Wallet = {
  id: string;
  currency: Currency;
  balance: number;
  name: string;
};

export type TransactionStatus = "Completed" | "Pending" | "Failed";

export type TransactionType = "Deposit" | "Withdrawal" | "Swap" | "Transfer";

export type Transaction = {
  id: string;
  date: string; // Storing as ISO string to be serializable for Redux Persist
  walletId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
};

export type LiveRates = Record<string, number>;
