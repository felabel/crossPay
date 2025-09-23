
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { addWallet } from "@/store/slices/wallets-slice";
import { addTransaction } from "@/store/slices/transactions-slice";
import { currencies } from "@/lib/data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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

const walletSchema = z.object({
  name: z.string().min(3, "Wallet name must be at least 3 characters."),
  currencyCode: z.string().min(1, "Please select a currency."),
  balance: z.coerce.number().min(0, "Initial balance cannot be negative."),
});

export default function WalletsPage() {
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const dispatch = useAppDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof walletSchema>>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: "",
      currencyCode: "",
      balance: 0,
    },
  });

  // This is a bit of a hack to get the new wallet ID for the transaction
  const getNextWalletId = () => {
    const lastId = wallets.length > 0 ? parseInt(wallets[wallets.length - 1].id.replace('w', '')) : 0;
    return `w${lastId + 1}`;
  }

  async function onSubmit(values: z.infer<typeof walletSchema>) {
    const currency = currencies.find((c) => c.code === values.currencyCode);
    if (!currency) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      
      const newWalletData = {
        name: values.name,
        currency,
        balance: values.balance,
      };

      // We need the ID for the transaction, so we predict it
      const nextId = getNextWalletId();

      dispatch(addWallet(newWalletData));
      
      if (values.balance > 0) {
          dispatch(addTransaction({
              walletId: nextId,
              amount: values.balance,
              type: 'Deposit',
              status: 'Completed',
              description: 'Initial balance'
          }));
      }

      toast({
        title: "Wallet Created",
        description: `Your new ${values.name} wallet is ready.`,
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Failed to Create Wallet",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Wallets</h2>
          <p className="text-muted-foreground">
            View and manage your currency wallets.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="card-wavy">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Wallet
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <Card key={wallet.id} className="card-wavy hover:scale-[1.02] transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{wallet.name}</span>
                <span className="text-lg font-mono p-2 bg-secondary rounded-md">{wallet.currency.symbol}</span>
              </CardTitle>
              <CardDescription>{wallet.currency.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: wallet.currency.code === 'BTC' ? 8 : 2,
                }).format(wallet.balance)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Wallet</DialogTitle>
            <DialogDescription>
              Set up a new wallet for a specific currency.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Savings" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name} ({c.code})
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
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Balance</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="ghost" disabled={isSubmitting}>Cancel</Button>
                 </DialogClose>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {isSubmitting ? "Creating..." : "Create Wallet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
