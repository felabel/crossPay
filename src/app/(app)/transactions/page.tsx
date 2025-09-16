import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { TransactionsTable } from "@/components/transactions/transactions-table";

export default function TransactionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          A detailed list of all your transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionsTable />
      </CardContent>
    </Card>
  );
}
