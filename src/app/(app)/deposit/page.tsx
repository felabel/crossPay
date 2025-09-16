"use client";

import React from "react";
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
  FormDescription,
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

const depositSchema = z.object({
  walletId: z.string().min(1, "Please select a wallet."),
  amount: z.coerce.number().positive("Amount must be positive."),
  description: z.string().optional(),
});

export default function DepositPage() {
  const { wallets, addTransaction, updateWalletBalance } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      walletId: "",
      amount: 0,
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof depositSchema>) {
    const wallet = wallets.find((w) => w.id === values.walletId);
    if (!wallet) return;

    addTransaction({
      walletId: values.walletId,
      amount: values.amount,
      type: "Deposit",
      status: "Completed",
      description: values.description || `Deposit to ${wallet.name}`,
    });
    
    updateWalletBalance(values.walletId, values.amount);

    toast({
      title: "Deposit Successful",
      description: `${new Intl.NumberFormat().format(values.amount)} ${
        wallet.currency.code
      } deposited to ${wallet.name}.`,
    });
    form.reset();
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Deposit Funds</CardTitle>
        <CardDescription>
          Add funds to one of your wallets. This is a simulation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Wallet</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a wallet to deposit into" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((w) => (
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
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Paycheck" {...field} />
                  </FormControl>
                  <FormDescription>
                    A brief note about this deposit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" variant="accent">
              Deposit Funds
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
