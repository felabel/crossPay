
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { updateWalletBalance } from "@/store/slices/wallets-slice";
import { addTransaction } from "@/store/slices/transactions-slice";
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
import { Loader2 } from "lucide-react";

const depositSchema = z.object({
  walletId: z.string().min(1, "Please select a wallet."),
  amount: z.coerce.number().positive("Amount must be positive."),
  description: z.string().optional(),
});

export default function DepositPage() {
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      walletId: "",
      amount: 0,
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof depositSchema>) {
    const wallet = wallets.find((w) => w.id === values.walletId);
    if (!wallet) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));

      dispatch(updateWalletBalance({ walletId: values.walletId, amount: values.amount }));
      dispatch(addTransaction({
        walletId: values.walletId,
        amount: values.amount,
        type: "Deposit",
        status: "Completed",
        description: values.description || `Deposit to ${wallet.name}`,
      }));

      toast({
        title: "Deposit Successful",
        description: `${new Intl.NumberFormat().format(values.amount)} ${
          wallet.currency.code
        } deposited to ${wallet.name}.`,
      });
      form.reset();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    disabled={isSubmitting}
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
                    <Input type="number" placeholder="0.00" {...field} disabled={isSubmitting} />
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
                    <Input placeholder="e.g., Paycheck" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    A brief note about this deposit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full card-wavy" variant="default" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Depositing..." : "Deposit Funds"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
