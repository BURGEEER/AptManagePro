import { StatCard } from "../StatCard";
import { Building2, Users, DollarSign, Wrench } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      <StatCard
        title="Total Properties"
        value="12"
        icon={Building2}
        trend={{ value: 8.2, isPositive: true }}
      />
      <StatCard
        title="Total Tenants"
        value="347"
        icon={Users}
        trend={{ value: 3.1, isPositive: true }}
      />
      <StatCard
        title="Monthly Revenue"
        value="$284,500"
        icon={DollarSign}
        trend={{ value: 12.5, isPositive: true }}
      />
      <StatCard
        title="Open Requests"
        value="23"
        icon={Wrench}
        trend={{ value: 5.3, isPositive: false }}
      />
    </div>
  );
}
