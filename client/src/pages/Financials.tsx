import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { DelinquentAccountCard } from "@/components/DelinquentAccountCard";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  AlertCircle, 
  FileText, 
  Filter, 
  Download, 
  Plus,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, AccountPayable } from "@shared/schema";

// Form schemas
const recordPaymentSchema = z.object({
  transactionId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
});

const accountPayableSchema = z.object({
  vendor: z.string().min(1),
  description: z.string().min(1),
  amount: z.string(),
  dueDate: z.string(),
  status: z.enum(["pending", "approved", "paid"]),
});

const transactionSchema = z.object({
  unitId: z.string().min(1),
  type: z.enum(["payment", "charge"]),
  category: z.enum(["dues", "utilities", "maintenance", "penalty", "other"]),
  amount: z.string(),
  description: z.string().min(1),
  transactionDate: z.string(),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "completed", "overdue", "cancelled"]),
  paymentMethod: z.string().optional(),
});

export default function Financials() {
  const { toast } = useToast();
  const [filterPeriod, setFilterPeriod] = useState("monthly");
  const [filterStatus, setFilterStatus] = useState("all");
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [addAccountPayableOpen, setAddAccountPayableOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Fetch financial stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/financial/stats", filterPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/financial/stats?period=${filterPeriod}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Fetch revenue chart data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/financial/revenue-chart"],
    queryFn: async () => {
      const response = await fetch("/api/financial/revenue-chart?months=6");
      if (!response.ok) throw new Error("Failed to fetch revenue data");
      return response.json();
    },
  });

  // Fetch delinquent accounts
  const { data: delinquentAccounts = [], isLoading: delinquentLoading } = useQuery({
    queryKey: ["/api/financial/delinquent-accounts"],
    queryFn: async () => {
      const response = await fetch("/api/financial/delinquent-accounts");
      if (!response.ok) throw new Error("Failed to fetch delinquent accounts");
      return response.json();
    },
  });

  // Fetch account payables
  const { data: accountPayables = [], isLoading: payablesLoading } = useQuery({
    queryKey: ["/api/account-payables"],
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions", filterStatus],
    queryFn: async () => {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const response = await fetch(`/api/transactions${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch payment status by property
  const { data: paymentByProperty = [], isLoading: propertyPaymentLoading } = useQuery({
    queryKey: ["/api/financial/payment-by-property"],
    queryFn: async () => {
      const response = await fetch("/api/financial/payment-by-property");
      if (!response.ok) throw new Error("Failed to fetch payment by property");
      return response.json();
    },
  });

  // Fetch common area expenses
  const { data: commonAreaExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/financial/common-area-expenses"],
    queryFn: async () => {
      const response = await fetch("/api/financial/common-area-expenses");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (data: z.infer<typeof recordPaymentSchema>) => 
      apiRequest("/api/financial/record-payment", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial"] });
      toast({
        title: "Payment recorded",
        description: "Payment has been successfully recorded.",
      });
      setRecordPaymentOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment.",
        variant: "destructive",
      });
    },
  });

  // Add account payable mutation
  const addAccountPayableMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("/api/account-payables", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-payables"] });
      toast({
        title: "Account payable added",
        description: "Account payable has been successfully added.",
      });
      setAddAccountPayableOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add account payable.",
        variant: "destructive",
      });
    },
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("/api/transactions", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial"] });
      toast({
        title: "Transaction added",
        description: "Transaction has been successfully added.",
      });
      setAddTransactionOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add transaction.",
        variant: "destructive",
      });
    },
  });

  // Forms
  const recordPaymentForm = useForm<z.infer<typeof recordPaymentSchema>>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      paymentMethod: "",
      notes: "",
    },
  });

  const accountPayableForm = useForm<z.infer<typeof accountPayableSchema>>({
    resolver: zodResolver(accountPayableSchema),
    defaultValues: {
      vendor: "",
      description: "",
      amount: "",
      dueDate: "",
      status: "pending",
    },
  });

  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      unitId: "",
      type: "payment",
      category: "dues",
      amount: "",
      description: "",
      transactionDate: new Date().toISOString().split('T')[0],
      status: "pending",
    },
  });

  const handleRecordPayment = (transaction: any) => {
    setSelectedTransaction(transaction);
    recordPaymentForm.reset({
      transactionId: transaction.id,
      amount: parseFloat(transaction.amount),
      paymentMethod: "",
      notes: "",
    });
    setRecordPaymentOpen(true);
  };

  const onRecordPaymentSubmit = (data: z.infer<typeof recordPaymentSchema>) => {
    recordPaymentMutation.mutate(data);
  };

  const onAccountPayableSubmit = (data: z.infer<typeof accountPayableSchema>) => {
    addAccountPayableMutation.mutate({
      ...data,
      amount: data.amount,
      propertyId: null, // This should come from user context
    });
  };

  const onTransactionSubmit = (data: z.infer<typeof transactionSchema>) => {
    addTransactionMutation.mutate({
      ...data,
      amount: data.amount,
    });
  };

  const handleExport = async () => {
    try {
      const data = {
        stats,
        revenue: revenueData,
        delinquentAccounts,
        accountPayables,
        transactions: transactions.slice(0, 100), // Limit for export
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Financial report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export financial report.",
        variant: "destructive",
      });
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return "text-chart-2 bg-chart-2/10";
      case "approved":
        return "text-chart-1 bg-chart-1/10";
      case "pending":
        return "text-chart-3 bg-chart-3/10";
      case "overdue":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num || 0);
  };

  if (statsLoading || revenueLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Financials</h1>
            <p className="text-muted-foreground">Loading financial data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Financials
          </h1>
          <p className="text-muted-foreground">
            Track revenue, expenses, and payment status
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-32" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue || 0)}
          icon={DollarSign}
          trend={{ value: stats?.revenueTrend || 0, isPositive: (stats?.revenueTrend || 0) > 0 }}
          subtitle="This month"
        />
        <StatCard
          title="Collected"
          value={formatCurrency(stats?.collected || 0)}
          icon={TrendingUp}
          trend={{ value: stats?.collectedTrend || 0, isPositive: (stats?.collectedTrend || 0) > 0 }}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(stats?.pending || 0)}
          icon={CreditCard}
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(stats?.overdue || 0)}
          icon={AlertCircle}
          trend={{ value: stats?.overdueTrend || 0, isPositive: false }}
        />
      </div>

      {revenueData && revenueData.length > 0 && (
        <RevenueChart data={revenueData} />
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="delinquent" data-testid="tab-delinquent">
            Delinquent Accounts
            {delinquentAccounts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {delinquentAccounts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payables" data-testid="tab-payables">Account Payables</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status by Property</CardTitle>
              </CardHeader>
              <CardContent>
                {propertyPaymentLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentByProperty.map((property: any) => (
                      <div key={property.property} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{property.property}</span>
                          <span className="text-sm text-muted-foreground">
                            {property.percentCollected}% collected
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${property.percentCollected}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Area Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commonAreaExpenses.map((expense: any) => (
                      <div key={expense.category} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-2xl font-semibold">{formatCurrency(expense.amount)}</p>
                        </div>
                        <Badge 
                          className={expense.change > 0 ? "bg-destructive/10 text-destructive" : "bg-chart-2/10 text-chart-2"}
                        >
                          {expense.change > 0 ? "+" : ""}{expense.change}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delinquent" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Overdue Accounts</h3>
            <Button 
              variant="outline"
              onClick={() => setRecordPaymentOpen(true)}
              data-testid="button-record-payment"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
          {delinquentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : delinquentAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {delinquentAccounts.map((account) => (
                <DelinquentAccountCard
                  key={account.id}
                  {...account}
                  onRecordPayment={() => handleRecordPayment(account)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No delinquent accounts</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Account Payables</h3>
            <Button 
              onClick={() => setAddAccountPayableOpen(true)}
              data-testid="button-add-payable"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payable
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {payablesLoading ? (
                <div className="p-6">
                  <Skeleton className="h-64" />
                </div>
              ) : accountPayables.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountPayables.map((payable: AccountPayable) => (
                      <TableRow key={payable.id}>
                        <TableCell className="font-medium">{payable.vendor}</TableCell>
                        <TableCell>{payable.description}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(payable.amount)}</TableCell>
                        <TableCell>{new Date(payable.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(payable.status)}>
                            {payable.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payable.approver || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No account payables</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setAddTransactionOpen(true)}
              data-testid="button-add-transaction"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {transactionsLoading ? (
                <div className="p-6">
                  <Skeleton className="h-64" />
                </div>
              ) : transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 50).map((transaction: Transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.transactionDate).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{transaction.type}</TableCell>
                        <TableCell className="capitalize">{transaction.category}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.status === 'pending' || transaction.status === 'overdue' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRecordPayment(transaction)}
                              data-testid={`button-record-${transaction.id}`}
                            >
                              Record
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for the selected transaction.
            </DialogDescription>
          </DialogHeader>
          <Form {...recordPaymentForm}>
            <form onSubmit={recordPaymentForm.handleSubmit(onRecordPaymentSubmit)} className="space-y-4">
              <FormField
                control={recordPaymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-payment-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={recordPaymentForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="online">Online Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={recordPaymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-payment-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRecordPaymentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={recordPaymentMutation.isPending}>
                  {recordPaymentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Account Payable Dialog */}
      <Dialog open={addAccountPayableOpen} onOpenChange={setAddAccountPayableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Account Payable</DialogTitle>
            <DialogDescription>
              Add a new account payable entry.
            </DialogDescription>
          </DialogHeader>
          <Form {...accountPayableForm}>
            <form onSubmit={accountPayableForm.handleSubmit(onAccountPayableSubmit)} className="space-y-4">
              <FormField
                control={accountPayableForm.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-vendor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountPayableForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-payable-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountPayableForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-payable-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountPayableForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountPayableForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payable-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddAccountPayableOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addAccountPayableMutation.isPending}>
                  {addAccountPayableMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Payable
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Add a new transaction entry.
            </DialogDescription>
          </DialogHeader>
          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
              <FormField
                control={transactionForm.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter unit ID" data-testid="input-unit-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="charge">Charge</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dues">Dues</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="penalty">Penalty</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={transactionForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-transaction-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-transaction-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-transaction-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddTransactionOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addTransactionMutation.isPending}>
                  {addTransactionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Transaction
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}