
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowRightLeft,
  Landmark,
  Send,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "@/hooks/use-redux";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const transactions = useAppSelector((state) => state.transactions.transactions);
  const exchangeRates = useAppSelector((state) => state.rates.rates);

  const convertToUSD = (amount: number, currencyCode: string) => {
    if (!exchangeRates) return 0;
    if (currencyCode === "USD") return amount;
    const rateKey = `${currencyCode}-USD`;
    const rate = exchangeRates[rateKey];
    return amount * (rate || 0);
  };

  const totalBalanceUSD = wallets.reduce((sum, wallet) => {
    return sum + convertToUSD(wallet.balance, wallet.currency.code);
  }, 0);
  
  const totalIncome = transactions
    .filter((t) => t.type === 'Deposit')
    .reduce((sum, t) => sum + convertToUSD(t.amount, wallets.find(w => w.id === t.walletId)?.currency.code || 'USD'), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'Transfer' || t.type === 'Withdrawal')
    .reduce((sum, t) => sum + convertToUSD(Math.abs(t.amount), wallets.find(w => w.id === t.walletId)?.currency.code || 'USD'), 0);

  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (amount: number, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="card-wavy bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance (USD)</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{formatCurrency(totalBalanceUSD)}</div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>
      <Card className="card-wavy bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
            <p className="text-xs text-muted-foreground">Active wallets</p>
          </CardContent>
        </Card>
        <Card className="card-wavy bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income (USD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="card-wavy bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses (USD)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card >
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Perform common actions with a single click.
          </CardDescription>
        </CardHeader>
        <CardContent className=" grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link href="/send" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2 card-wavy hover:bg-gradient-to-r from-blue-500 to-indigo-600">
              <Send className="w-6 h-6" />
              <span>Send</span>
            </Button>
          </Link>
          <Link href="/swap" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2 card-wavy hover:bg-gradient-to-r from-blue-500 to-indigo-600">
              <ArrowRightLeft className="w-6 h-6" />
              <span>Swap</span>
            </Button>
          </Link>
          <Link href="/deposit" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2 card-wavy hover:bg-gradient-to-r from-blue-500 to-indigo-600">
              <Landmark className="w-6 h-6" />
              <span>Deposit</span>
            </Button>
          </Link>
          <Link href="/wallets" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2 card-wavy hover:bg-gradient-to-r from-blue-500 to-indigo-600">
              <Wallet className="w-6 h-6" />
              <span>Manage Wallets</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx, index) => (
              <React.Fragment key={tx.id}>
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    {tx.type === 'Deposit' && <TrendingUp className="h-5 w-5 text-green-500" />}
                    {tx.type === 'Withdrawal' && <TrendingDown className="h-5 w-5 text-red-500" />}
                    {tx.type === 'Transfer' && <Send className="h-5 w-5 text-blue-500" />}
                    {tx.type === 'Swap' && <ArrowRightLeft className="h-5 w-5 text-purple-500" />}
                  </div>
                  <div className="ml-4 flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(tx.amount, wallets.find(w => w.id === tx.walletId)?.currency.code)}</p>
                    <Badge variant={tx.status === 'Completed' ? 'default' : 'secondary'} className={`${tx.status === 'Completed' ? 'bg-green-100 text-green-800' : tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{tx.status}</Badge>
                  </div>
                </div>
                {index < recentTransactions.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
