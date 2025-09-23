
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { performSwap } from "@/store/slices/wallets-slice";
import { addTransaction } from "@/store/slices/transactions-slice";
import { fetchExchangeRates } from "@/store/slices/rates-slice";
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
import { ArrowRightLeft, Loader2, RefreshCw } from "lucide-react";

const swapSchema = z.object({
  fromWalletId: z.string().min(1, "Please select a source wallet."),
  toWalletId: z.string().min(1, "Please select a destination wallet."),
  fromAmount: z.coerce.number().positive("Amount must be positive."),
}).refine(data => data.fromWalletId !== data.toWalletId, {
    message: "Source and destination wallets cannot be the same.",
    path: ["toWalletId"],
});

export default function SwapPage() {
  const dispatch = useAppDispatch();
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const { rates: exchangeRates, status: ratesStatus } = useAppSelector((state) => state.rates);
  const { toast } = useToast();

  const [toAmount, setToAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRate, setCurrentRate] = useState<number | null>(null);

  const form = useForm<z.infer<typeof swapSchema>>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      fromWalletId: "",
      toWalletId: "",
      fromAmount: 0,
    },
  });

  const { watch, trigger, setValue } = form;
  const fromWalletId = watch("fromWalletId");
  const toWalletId = watch("toWalletId");
  const fromAmount = watch("fromAmount");
  
  const fromWalletOptions = wallets;
  const toWalletOptions = wallets.filter(w => w.id !== fromWalletId);


  const calculateRate = useCallback(() => {
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);

    if (fromWallet && toWallet && fromAmount > 0 && exchangeRates) {
      if (fromWallet.currency.code === toWallet.currency.code) {
        setToAmount(fromAmount);
        setCurrentRate(1);
        return;
      }
      const rateKey = `${fromWallet.currency.code}-${toWallet.currency.code}`;
      const rate = exchangeRates[rateKey];
      if (rate) {
        setToAmount(fromAmount * rate);
        setCurrentRate(rate);
      } else {
        setToAmount(0);
        setCurrentRate(null);
      }
    } else {
      setToAmount(0);
      setCurrentRate(null);
    }
  }, [fromWalletId, toWalletId, fromAmount, wallets, exchangeRates]);

  useEffect(() => {
    calculateRate();
  }, [calculateRate]);

  useEffect(() => {
    // When fromWallet changes, if the toWallet is the same, clear toWallet
    if (fromWalletId && fromWalletId === toWalletId) {
      setValue("toWalletId", "");
    }
    // Also trigger validation to update the UI
    if (fromWalletId && toWalletId) {
      trigger("toWalletId");
    }
  }, [fromWalletId, toWalletId, setValue, trigger]);


  async function onSubmit(values: z.infer<typeof swapSchema>) {
    console.log("Submitting swap:", values);
    const fromWallet = wallets.find((w) => w.id === values.fromWalletId);
    const toWallet = wallets.find((w) => w.id === values.toWalletId);
    
    if (!fromWallet || !toWallet || !currentRate) {
      toast({
        variant: "destructive",
        title: "Swap Failed",
        description: "Invalid wallet selection or rate unavailable.",
      });
      return;
    }

    if(fromWallet.balance < values.fromAmount) {
        toast({
            variant: "destructive",
            title: "Swap Failed",
            description: "Insufficient funds for this swap.",
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      
      const receivedAmount = values.fromAmount * currentRate;

      dispatch(performSwap({
          fromWalletId: values.fromWalletId,
          toWalletId: values.toWalletId,
          fromAmount: values.fromAmount,
          receivedAmount: receivedAmount,
      }));

      dispatch(addTransaction({
          walletId: fromWallet.id,
          amount: -values.fromAmount,
          type: 'Swap',
          status: 'Completed',
          description: `Swap to ${toWallet.currency.code}`
      }));
      dispatch(addTransaction({
          walletId: toWallet.id,
          amount: receivedAmount,
          type: 'Swap',
          status: 'Completed',
          description: `Swap from ${fromWallet.currency.code}`
      }));

      toast({
        title: "Swap Successful",
        description: `Swapped ${values.fromAmount} ${fromWallet.currency.code} to ${receivedAmount.toFixed(4)} ${toWallet.currency.code}.`,
      });
      form.reset();
      setToAmount(0);
      setCurrentRate(null);

    } catch(error) {
       toast({
        variant: "destructive",
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleRefreshRates = async () => {
    dispatch(fetchExchangeRates());
    toast({
      title: "Rates Updated",
      description: "The latest exchange rates have been fetched.",
    });
  }

  const isRefreshing = ratesStatus === 'loading';

  console.log("to amount:", toAmount, "currentRate:", currentRate);
  const isSameCurrency = (() => {
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);
    return !!fromWallet && !!toWallet && fromWallet.currency.code === toWallet.currency.code;
  })();
  console.log("isSameCurrency:", isSameCurrency);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Swap Currency</CardTitle>
        <CardDescription>
          Exchange funds between your wallets using live market rates.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Source Wallet" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fromWalletOptions.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
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
                      <Input type="number" placeholder="0.00" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center justify-center relative">
                 <div className="absolute w-full h-[1px] bg-border"></div>
                <Button 
                    type="button" 
                    variant="outline"
                    size="icon"
                    onClick={handleRefreshRates}
                    disabled={isRefreshing || isSubmitting}
                    className="z-10 h-10 w-10 bg-background border rounded-full flex items-center justify-center"
                >
                    <RefreshCw className={`w-5 h-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 items-start md:grid-cols-2 md:gap-8">
              <FormField
                control={form.control}
                name="toWalletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || !fromWalletId} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Destination Wallet" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {toWalletOptions.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
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
                  <FormLabel>You receive (approx.)</FormLabel>
                  <FormControl>
                    {isSameCurrency ? (
                        <Input type="number" readOnly value={toAmount > 0 ? toAmount : "0.00"} className="bg-muted" />
                    ) : (
                        <Input type="number" readOnly value={toAmount > 0 ? toAmount?.toFixed(4) : "0.00"} className="bg-muted" />
                    )}
                    
                    {/* <Input type="number" readOnly value={toAmount > 0 ? toAmount?.toFixed(4) : "0.00"} className="bg-muted" /> */}
                  </FormControl>
                  <FormMessage />
              </FormItem>
            </div>
             {currentRate && fromWalletId && toWalletId && wallets.find(w => w.id === fromWalletId)?.currency.code !== wallets.find(w => w.id === toWalletId)?.currency.code && <p className="text-sm text-muted-foreground text-center">Exchange Rate: 1 {wallets.find(w => w.id === fromWalletId)?.currency.code} = {currentRate.toFixed(4)} {wallets.find(w => w.id === toWalletId)?.currency.code}</p>}

            <Button type="submit" className="w-full" variant="default" disabled={isSubmitting || !currentRate}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Swapping..." : "Swap"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    