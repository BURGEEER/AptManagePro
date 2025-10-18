import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { DollarSign, TrendingUp, CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Financials() {
  const revenueData = [
    { month: "Jul", revenue: 245000 },
    { month: "Aug", revenue: 268000 },
    { month: "Sep", revenue: 255000 },
    { month: "Oct", revenue: 278000 },
    { month: "Nov", revenue: 292000 },
    { month: "Dec", revenue: 284500 },
  ];

  const recentPayments = [
    {
      id: "1",
      tenant: "Sarah Johnson",
      property: "Riverside Apartments",
      unit: "204",
      amount: 1500,
      status: "paid",
      date: "Dec 1, 2024",
    },
    {
      id: "2",
      tenant: "Michael Chen",
      property: "Downtown Luxury Suites",
      unit: "105",
      amount: 3200,
      status: "pending",
      date: "Dec 3, 2024",
    },
    {
      id: "3",
      tenant: "Emma Williams",
      property: "Riverside Apartments",
      unit: "312",
      amount: 1650,
      status: "overdue",
      date: "Nov 28, 2024",
    },
    {
      id: "4",
      tenant: "David Martinez",
      property: "Urban Heights",
      unit: "501",
      amount: 1850,
      status: "paid",
      date: "Dec 1, 2024",
    },
    {
      id: "5",
      tenant: "Lisa Anderson",
      property: "Meadow View Commons",
      unit: "208",
      amount: 1600,
      status: "paid",
      date: "Dec 2, 2024",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-chart-2 bg-chart-2/10";
      case "pending":
        return "text-chart-3 bg-chart-3/10";
      case "overdue":
        return "text-chart-5 bg-chart-5/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">
          Financials
        </h1>
        <p className="text-muted-foreground">
          Track revenue, expenses, and payment status
        </p>
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
          value="$4,000"
          icon={AlertCircle}
          trend={{ value: 15.2, isPositive: false }}
        />
      </div>

      <RevenueChart data={revenueData} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Recent Payments</CardTitle>
          <Button variant="outline" size="sm" data-testid="button-view-all">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                data-testid={`payment-row-${payment.id}`}
              >
                <div className="space-y-1">
                  <div className="font-medium" data-testid={`text-tenant-${payment.id}`}>
                    {payment.tenant}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payment.property} - Unit {payment.unit}
                  </div>
                  <div className="text-xs text-muted-foreground">{payment.date}</div>
                </div>
                <div className="text-right space-y-2">
                  <div className="font-mono font-semibold" data-testid={`text-amount-${payment.id}`}>
                    ${payment.amount.toLocaleString()}
                  </div>
                  <Badge className={getStatusColor(payment.status)} data-testid={`badge-status-${payment.id}`}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
