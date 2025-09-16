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
import { useApp } from "@/context/app-context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const { wallets, transactions } = useApp();

  const totalBalance = wallets.reduce((acc, wallet) => {
    // A simple conversion for demo purposes. NOT FOR PRODUCTION.
    let rate = 1;
    if (wallet.currency.code === "EUR") rate = 1.08;
    if (wallet.currency.code === "GBP") rate = 1.26;
    if (wallet.currency.code === "JPY") rate = 0.0064;
    if (wallet.currency.code === "BTC") rate = 65000;
    return acc + wallet.balance * rate;
  }, 0);

  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (amount: number, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all wallets (in USD)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
            <p className="text-xs text-muted-foreground">Active wallets</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(3500)}</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(850)}</div>
            <p className="text-xs text-muted-foreground">-5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Perform common actions with a single click.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link href="/send" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
              <Send className="w-6 h-6" />
              <span>Send</span>
            </Button>
          </Link>
          <Link href="/swap" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
              <ArrowRightLeft className="w-6 h-6" />
              <span>Swap</span>
            </Button>
          </Link>
          <Link href="/deposit" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
              <Landmark className="w-6 h-6" />
              <span>Deposit</span>
            </Button>
          </Link>
          <Link href="/wallets" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
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
                    <p className="text-sm text-muted-foreground">{tx.date.toLocaleDateString()}</p>
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
