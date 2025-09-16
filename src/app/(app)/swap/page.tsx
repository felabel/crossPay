"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp } from "@/context/app-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft } from "lucide-react";

const swapSchema = z.object({
  fromWalletId: z.string().min(1, "Please select a source wallet."),
  toWalletId: z.string().min(1, "Please select a destination wallet."),
  fromAmount: z.coerce.number().positive("Amount must be positive."),
});

// Dummy exchange rates for simulation
const exchangeRates: { [key: string]: number } = {
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

export default function SwapPage() {
  const { wallets, addTransaction, updateWalletBalance } = useApp();
  const { toast } = useToast();
  const [toAmount, setToAmount] = useState(0);

  const form = useForm<z.infer<typeof swapSchema>>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      fromWalletId: "",
      toWalletId: "",
      fromAmount: 0,
    },
  });

  const { watch, setValue } = form;
  const fromWalletId = watch("fromWalletId");
  const toWalletId = watch("toWalletId");
  const fromAmount = watch("fromAmount");

  useEffect(() => {
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);

    if (fromWallet && toWallet && fromAmount > 0) {
      if (fromWallet.currency.code === toWallet.currency.code) {
        setToAmount(fromAmount);
        return;
      }
      const rateKey = `${fromWallet.currency.code}-${toWallet.currency.code}`;
      const rate = exchangeRates[rateKey];
      if (rate) {
        setToAmount(fromAmount * rate);
      } else {
        setToAmount(0); // No direct rate, could implement triangulation
      }
    } else {
      setToAmount(0);
    }
  }, [fromWalletId, toWalletId, fromAmount, wallets]);

  function onSubmit(values: z.infer<typeof swapSchema>) {
    const fromWallet = wallets.find((w) => w.id === values.fromWalletId);
    const toWallet = wallets.find((w) => w.id === values.toWalletId);
    
    if (!fromWallet || !toWallet || fromWallet.balance < values.fromAmount) {
      toast({
        variant: "destructive",
        title: "Swap Failed",
        description: "Insufficient funds or invalid wallets selected.",
      });
      return;
    }

    updateWalletBalance(fromWallet.id, -values.fromAmount);
    updateWalletBalance(toWallet.id, toAmount);

    addTransaction({
      walletId: fromWallet.id,
      amount: -values.fromAmount,
      type: "Swap",
      status: "Completed",
      description: `Swap to ${toWallet.currency.code}`,
    });
    addTransaction({
      walletId: toWallet.id,
      amount: toAmount,
      type: "Swap",
      status: "Completed",
      description: `Swap from ${fromWallet.currency.code}`,
    });

    toast({
      title: "Swap Successful",
      description: `Swapped ${values.fromAmount} ${fromWallet.currency.code} to ${toAmount.toFixed(4)} ${toWallet.currency.code}.`,
    });
    form.reset();
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Swap Currency</CardTitle>
        <CardDescription>
          Exchange funds between your wallets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 items-start md:grid-cols-2 md:gap-8">
              <FormField
                control={form.control}
                name="fromWalletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Source Wallet" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((w) => (
                          <SelectItem key={w.id} value={w.id} disabled={w.id === toWalletId}>
                            {w.name} ({new Intl.NumberFormat().format(w.balance)} {w.currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>You send</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center justify-center">
                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 items-start md:grid-cols-2 md:gap-8">
              <FormField
                control={form.control}
                name="toWalletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Destination Wallet" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((w) => (
                          <SelectItem key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                            {w.name} ({w.currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                  <FormLabel>You receive</FormLabel>
                  <FormControl>
                    <Input type="number" readOnly value={toAmount.toFixed(4)} className="bg-muted" />
                  </FormControl>
                  <FormMessage />
              </FormItem>
            </div>

            <Button type="submit" className="w-full" variant="accent">Swap</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
