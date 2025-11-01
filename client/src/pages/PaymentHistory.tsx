import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  DollarSign,
  Calendar,
  FileText,
  Download,
  Search,
  Filter,
  AlertCircle,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { format } from "date-fns";
import type { Transaction, Tenant } from "@shared/schema";

export default function PaymentHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Fetch current user
  const { data: currentUser, isLoading: isUserLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch tenant information
  const { data: tenant, isLoading: isTenantLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenants/me"],
    enabled: !!currentUser && currentUser.role === "TENANT",
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/me"],
    enabled: !!currentUser && currentUser.role === "TENANT",
  });

  const isLoading = isUserLoading || isTenantLoading || isTransactionsLoading;

  // Check if user is a tenant
  if (!isLoading && currentUser?.role !== "TENANT") {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This page is only accessible to tenants. Please log in with a tenant account.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.amount.toString().includes(searchQuery) ||
        t.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const startDate = new Date();
      
      switch(dateRange) {
        case "30days":
          startDate.setDate(now.getDate() - 30);
          break;
        case "60days":
          startDate.setDate(now.getDate() - 60);
          break;
        case "90days":
          startDate.setDate(now.getDate() - 90);
          break;
        case "6months":
          startDate.setMonth(now.getMonth() - 6);
          break;
        case "1year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }

    // Sort by date (most recent first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, statusFilter, typeFilter, dateRange]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalPaid = transactions
      .filter(t => t.status === "completed" && t.type === "payment")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalPending = transactions
      .filter(t => t.status === "pending")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalOverdue = transactions
      .filter(t => {
        if (t.status === "pending" && t.dueDate) {
          return new Date(t.dueDate) < new Date();
        }
        return false;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const currentBalance = totalPending + totalOverdue;

    const lastPaymentDate = transactions
      .filter(t => t.status === "completed" && t.type === "payment")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      currentBalance,
      lastPaymentDate,
      completedCount: transactions.filter(t => t.status === "completed").length,
      pendingCount: transactions.filter(t => t.status === "pending").length,
    };
  }, [transactions]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
      case "overdue":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get status variant
  const getStatusVariant = (status: string): "default" | "secondary" | "success" | "destructive" | "outline" => {
    switch(status) {
      case "completed":
        return "success";
      case "pending":
        return "secondary";
      case "failed":
      case "overdue":
        return "destructive";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-6">Payment History</h1>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment History</h1>
          <p className="text-muted-foreground">View and manage your payment transactions</p>
        </div>
        <Button size="lg" className="gap-2" data-testid="button-make-payment">
          <CreditCard className="h-4 w-4" />
          Make Payment
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">${statistics.currentBalance.toFixed(2)}</p>
              {statistics.currentBalance > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${statistics.totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">${statistics.totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {statistics.lastPaymentDate 
                ? format(new Date(statistics.lastPaymentDate), "MMM dd, yyyy")
                : "No payments yet"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for overdue payments */}
      {statistics.totalOverdue > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have overdue payments totaling ${statistics.totalOverdue.toFixed(2)}. 
            Please make a payment as soon as possible to avoid late fees.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-transactions"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="charge">Charge</SelectItem>
                <SelectItem value="fee">Fee</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]" data-testid="select-date-range">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="60days">Last 60 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          {filteredTransactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.description || "Payment"}</p>
                          {transaction.referenceNumber && (
                            <p className="text-xs text-muted-foreground">Ref: {transaction.referenceNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <Badge variant={getStatusVariant(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={transaction.type === "payment" || transaction.type === "refund" ? "text-green-600" : ""}>
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          data-testid={`button-download-receipt-${transaction.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}