"use client";

import React from "react";
import { useApp } from "@/context/app-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";
import { exchangeRates } from "@/lib/data";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AnalyticsPage() {
  const { wallets, transactions } = useApp();

  const convertToUSD = (amount: number, currencyCode: string) => {
    if (currencyCode === "USD") return amount;
    const rate = exchangeRates[`${currencyCode}-USD`];
    return amount * (rate || 0);
  };
  
  const formatCurrency = (amount: number, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
  }

  const portfolioData = wallets.map((wallet) => ({
    name: wallet.currency.code,
    value: convertToUSD(wallet.balance, wallet.currency.code),
  })).filter(item => item.value > 0);

  const totalBalanceUSD = portfolioData.reduce((sum, item) => sum + item.value, 0);

  const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

  transactions.forEach((tx) => {
    const month = tx.date.toLocaleString("default", { month: "short", year: "numeric" });
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expenses: 0 };
    }
    const amountUSD = convertToUSD(Math.abs(tx.amount), wallets.find(w => w.id === tx.walletId)?.currency.code || 'USD');
    if (tx.amount > 0) {
      monthlyData[month].income += amountUSD;
    } else {
      monthlyData[month].expenses += amountUSD;
    }
  });

  const incomeExpenseData = Object.entries(monthlyData)
    .map(([name, values]) => ({ name, ...values }))
    .reverse();

  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + convertToUSD(t.amount, wallets.find(w => w.id === t.walletId)?.currency.code || 'USD'), 0);

  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + convertToUSD(Math.abs(t.amount), wallets.find(w => w.id === t.walletId)?.currency.code || 'USD'), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Analytics</CardTitle>
          <CardDescription>
            An overview of your financial activity and portfolio distribution.
          </CardDescription>
        </CardHeader>
      </Card>
      
       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance (USD)</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalanceUSD)}</div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income (USD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
             <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses (USD)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Distribution</CardTitle>
            <CardDescription>Your asset allocation in USD value.</CardDescription>
          </CardHeader>
          <CardContent>
             {portfolioData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No wallet data to display.
                </div>
             )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Income vs. Expense</CardTitle>
             <CardDescription>Monthly cash flow in USD.</CardDescription>
          </CardHeader>
          <CardContent>
             {incomeExpenseData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`}/>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
             ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No transaction data to display.
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
