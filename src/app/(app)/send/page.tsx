
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { performSend } from "@/store/slices/wallets-slice";
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

const sendSchema = z.object({
  fromWalletId: z.string().min(1, "Please select a wallet."),
  amount: z.coerce.number().positive("Amount must be positive."),
  recipient: z.string().min(26, "Please enter a valid wallet address.").max(42, "Please enter a valid wallet address."),
  description: z.string().optional(),
});

export default function SendPage() {
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof sendSchema>>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      fromWalletId: "",
      amount: 0,
      recipient: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof sendSchema>) {
    const fromWallet = wallets.find((w) => w.id === values.fromWalletId);
    if (!fromWallet) return;
    
    if (fromWallet.balance < values.amount) {
        toast({
            variant: "destructive",
            title: "Send Failed",
            description: "Insufficient funds.",
        });
        return;
    }

    setIsSubmitting(true);
    
    try {
        // Simulate API call
        await new Promise(res => setTimeout(res, 1000));

        dispatch(performSend({ fromWalletId: values.fromWalletId, amount: values.amount }));
        dispatch(addTransaction({
            walletId: values.fromWalletId,
            amount: -values.amount,
            type: "Transfer",
            status: "Completed",
            description: values.description || `Sent to ${values.recipient.substring(0,10)}...`,
        }));
      
      toast({
        title: "Funds Sent",
        description: `${values.amount} ${fromWallet.currency.code} sent to wallet ${values.recipient.substring(0,10)}...`,
      });
      form.reset();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Send Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Funds</CardTitle>
        <CardDescription>
          Transfer funds from your wallet to another wallet address.
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                  <FormLabel>Recipient Wallet Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 0x..." {...field} disabled={isSubmitting}/>
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
                    <Input type="number" placeholder="0.00" {...field} disabled={isSubmitting}/>
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
                    <Input placeholder="e.g., For dinner" {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full card-wavy" variant="default" disabled={isSubmitting}>
               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Sending..." : "Send Funds"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
