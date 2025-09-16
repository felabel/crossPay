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

const sendSchema = z.object({
  fromWalletId: z.string().min(1, "Please select a wallet."),
  amount: z.coerce.number().positive("Amount must be positive."),
  recipient: z.string().min(3, "Recipient name is required."),
  description: z.string().optional(),
});

export default function SendPage() {
  const { wallets, addTransaction, updateWalletBalance } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof sendSchema>>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      fromWalletId: "",
      amount: 0,
      recipient: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof sendSchema>) {
    const fromWallet = wallets.find((w) => w.id === values.fromWalletId);
    
    if (!fromWallet || fromWallet.balance < values.amount) {
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: "Insufficient funds or invalid wallet.",
      });
      return;
    }

    updateWalletBalance(fromWallet.id, -values.amount);

    addTransaction({
      walletId: fromWallet.id,
      amount: -values.amount,
      type: "Transfer",
      status: "Completed",
      description: values.description || `Sent to ${values.recipient}`,
    });

    toast({
      title: "Funds Sent",
      description: `${values.amount} ${fromWallet.currency.code} sent to ${values.recipient}.`,
    });
    form.reset();
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Funds</CardTitle>
        <CardDescription>
          Transfer funds from your wallet to a recipient.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="fromWalletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((w) => (
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
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe or john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Send</FormLabel>
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
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., For dinner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" variant="accent">
              Send Funds
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
