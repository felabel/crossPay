export type Currency = {
  code: string;
  name: string;
  symbol: string;
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
  date: Date;
  walletId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
};
