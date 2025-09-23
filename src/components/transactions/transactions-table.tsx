
"use client";

import React, { useState, useMemo } from "react";
import { useAppSelector } from "@/hooks/use-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Transaction } from "@/lib/types";

type SortKey = "date" | "amount";

export function TransactionsTable() {
  const { transactions } = useAppSelector((state) => state.transactions);
  const { wallets } = useAppSelector((state) => state.wallets);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>({ key: "date", direction: "descending" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const sortedTransactions = useMemo(() => {
    let sortableItems: Transaction[] = [...transactions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = sortConfig.key === 'date' ? new Date(a.date).getTime() : a.amount;
        const bValue = sortConfig.key === 'date' ? new Date(b.date).getTime() : b.amount;
        
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [transactions, sortConfig]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  }

  const formatCurrency = (amount: number, currencyCode = "USD") => {
     const wallet = wallets.find(w => w.currency.code === currencyCode);
     const maximumFractionDigits = wallet?.currency.code === 'BTC' ? 8 : 2;
     return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits,
      }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("date")}>
                  Date {getSortIcon("date")}
                </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => requestSort("amount")}>
                  Amount {getSortIcon("amount")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((tx) => {
              const wallet = wallets.find((w) => w.id === tx.walletId);
              return (
                <TableRow key={tx.id}>
                  <TableCell>
                    {new Date(tx.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === "Completed"
                          ? "default"
                          : tx.status === "Pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className={`
                        ${tx.status === "Completed" && "bg-green-100 text-green-800 hover:bg-green-200"}
                        ${tx.status === "Pending" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}
                        ${tx.status === "Failed" && "bg-red-100 text-red-800 hover:bg-red-200"}
                      `}
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                    {tx.amount > 0 ? "+" : ""}
                    {formatCurrency(tx.amount, wallet?.currency.code)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
