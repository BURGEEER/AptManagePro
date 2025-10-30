import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { DelinquentAccountCard } from "@/components/DelinquentAccountCard";
import { DollarSign, TrendingUp, CreditCard, AlertCircle, FileText, Filter, Download, Plus } from "lucide-react";
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

export default function Financials() {
  const [filterPeriod, setFilterPeriod] = useState("monthly");
  const [filterStatus, setFilterStatus] = useState("all");

  const revenueData = [
    { month: "Jul", revenue: 245000 },
    { month: "Aug", revenue: 268000 },
    { month: "Sep", revenue: 255000 },
    { month: "Oct", revenue: 278000 },
    { month: "Nov", revenue: 292000 },
    { month: "Dec", revenue: 284500 },
  ];

  const delinquentAccounts = [
    {
      id: "1",
      ownerName: "Robert Thompson",
      unit: "A-405",
      property: "Riverside Apartments",
      totalOwed: 9500,
      monthsOverdue: 3,
      lastPayment: "Sep 2024",
      status: "warning" as const,
    },
    {
      id: "2",
      ownerName: "Patricia Davis",
      unit: "B-301",
      property: "Downtown Luxury Suites",
      totalOwed: 15200,
      monthsOverdue: 5,
      lastPayment: "Jul 2024",
      status: "critical" as const,
    },
    {
      id: "3",
      ownerName: "William Martinez",
      unit: "C-102",
      property: "Urban Heights",
      totalOwed: 22800,
      monthsOverdue: 7,
      lastPayment: "May 2024",
      status: "legal" as const,
    },
    {
      id: "4",
      ownerName: "Linda Johnson",
      unit: "D-201",
      property: "Meadow View Commons",
      totalOwed: 6400,
      monthsOverdue: 3,
      lastPayment: "Sep 2024",
      status: "warning" as const,
    },
  ];

  const accountPayables = [
    {
      id: "1",
      vendor: "Elite Maintenance Services",
      description: "Monthly maintenance contract",
      amount: 12500,
      dueDate: "Dec 30, 2024",
      status: "pending",
      approver: "John Admin",
      lastModified: "Dec 18, 2024 10:30 AM",
    },
    {
      id: "2",
      vendor: "SecureGuard Security",
      description: "Security services - December",
      amount: 8900,
      dueDate: "Dec 28, 2024",
      status: "approved",
      approver: "Sarah Manager",
      lastModified: "Dec 17, 2024 2:45 PM",
    },
    {
      id: "3",
      vendor: "PowerTech Electrical",
      description: "Electrical repairs Building B",
      amount: 4500,
      dueDate: "Jan 5, 2025",
      status: "paid",
      approver: "Mike Supervisor",
      lastModified: "Dec 15, 2024 9:00 AM",
    },
  ];

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-chart-2 bg-chart-2/10";
      case "approved":
        return "text-chart-1 bg-chart-1/10";
      case "pending":
        return "text-chart-3 bg-chart-3/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

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
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value="$284,500"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          subtitle="This month"
        />
        <StatCard
          title="Collected"
          value="$268,200"
          icon={TrendingUp}
          trend={{ value: 8.3, isPositive: true }}
        />
        <StatCard
          title="Pending"
          value="$12,300"
          icon={CreditCard}
        />
        <StatCard
          title="Overdue"
          value="$53,900"
          icon={AlertCircle}
          trend={{ value: 15.2, isPositive: false }}
        />
      </div>

      <RevenueChart data={revenueData} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="delinquent" data-testid="tab-delinquent">
            Delinquent Accounts
            <Badge variant="destructive" className="ml-2">
              {delinquentAccounts.length}
            </Badge>
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
                <div className="space-y-4">
                  {["Riverside Apartments", "Downtown Luxury Suites", "Urban Heights", "Meadow View Commons"].map(
                    (property, index) => (
                      <div key={property} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{property}</span>
                          <span className="text-sm text-muted-foreground">
                            {85 + index * 3}% collected
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${85 + index * 3}%` }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Area Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Utilities</span>
                    <span className="font-mono font-medium">$18,500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maintenance</span>
                    <span className="font-mono font-medium">$12,500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security</span>
                    <span className="font-mono font-medium">$8,900</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cleaning</span>
                    <span className="font-mono font-medium">$6,200</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="font-medium">Total</span>
                    <span className="font-mono font-semibold">$46,100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delinquent" className="space-y-4">
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-destructive">
                  Delinquent Accounts (3+ Months Overdue)
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-destructive">
                    ${delinquentAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {delinquentAccounts.map((account) => (
                  <DelinquentAccountCard key={account.id} {...account} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Account Payables - Contractor Payments</CardTitle>
                <Button size="sm" data-testid="button-add-payable">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Last Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountPayables.map((payable) => (
                    <TableRow key={payable.id} data-testid={`row-payable-${payable.id}`}>
                      <TableCell className="font-medium">{payable.vendor}</TableCell>
                      <TableCell className="text-sm">{payable.description}</TableCell>
                      <TableCell className="font-mono font-medium">
                        ${payable.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{payable.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(payable.status)}>
                          {payable.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{payable.approver}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payable.lastModified}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request for Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Generate Payment Request</p>
                  <p className="text-sm text-muted-foreground">Create formal payment requests for owners</p>
                </div>
                <Button data-testid="button-payment-request">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Request
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Bulk Payment Processing</p>
                  <p className="text-sm text-muted-foreground">Process multiple payments at once</p>
                </div>
                <Button variant="outline" data-testid="button-bulk-process">
                  Process Payments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}