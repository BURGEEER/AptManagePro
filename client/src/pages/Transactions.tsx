import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Download, 
  Filter,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock transaction data
  const transactions = [
    {
      id: "TXN001",
      date: "Dec 20, 2024",
      type: "payment",
      description: "Monthly dues payment",
      owner: "Sarah Johnson",
      unit: "A-204",
      amount: 1500,
      status: "completed",
      reference: "REF-2024-1220-001",
    },
    {
      id: "TXN002",
      date: "Dec 19, 2024",
      type: "request",
      description: "Payment request for dues",
      owner: "Michael Chen",
      unit: "B-105",
      amount: 3200,
      status: "pending",
      reference: "REQ-2024-1219-002",
    },
    {
      id: "TXN003",
      date: "Dec 18, 2024",
      type: "payment",
      description: "Partial payment for November",
      owner: "Emma Williams",
      unit: "C-312",
      amount: 800,
      status: "completed",
      reference: "REF-2024-1218-003",
    },
    {
      id: "TXN004",
      date: "Dec 17, 2024",
      type: "refund",
      description: "Overpayment refund",
      owner: "David Martinez",
      unit: "D-501",
      amount: -250,
      status: "completed",
      reference: "RFD-2024-1217-004",
    },
    {
      id: "TXN005",
      date: "Dec 16, 2024",
      type: "request",
      description: "Special assessment request",
      owner: "Lisa Anderson",
      unit: "A-208",
      amount: 500,
      status: "rejected",
      reference: "REQ-2024-1216-005",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-chart-2" />;
      case "pending":
        return <Clock className="h-4 w-4 text-chart-3" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-chart-5" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-chart-2 bg-chart-2/10";
      case "pending":
        return "text-chart-3 bg-chart-3/10";
      case "rejected":
        return "text-chart-5 bg-chart-5/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-primary/10 text-primary";
      case "request":
        return "bg-chart-1/10 text-chart-1";
      case "refund":
        return "bg-chart-4/10 text-chart-4";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const transactionSummary = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Transactions
          </h1>
          <p className="text-muted-foreground">
            Payment requests and transaction history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-export-transactions">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button data-testid="button-new-request">
            <FileText className="h-4 w-4 mr-2" />
            Request Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{transactionSummary.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono">
              ${transactionSummary.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-chart-2">
              {transactionSummary.completed}
            </div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-chart-3">
              {transactionSummary.pending}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-transactions"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40" data-testid="select-filter-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="request">Requests</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Owner/Unit</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                  <TableCell className="font-mono text-sm">
                    {transaction.reference}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{transaction.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="text-sm">{transaction.description}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{transaction.owner}</div>
                      <div className="text-muted-foreground">Unit {transaction.unit}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono font-medium ${
                      transaction.amount < 0 ? 'text-chart-5' : ''
                    }`}>
                      {transaction.amount < 0 ? '-' : '+'}$
                      {Math.abs(transaction.amount).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}