import { useState } from "react";
import { TenantCard } from "@/components/TenantCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function Tenants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const tenants = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(555) 123-4567",
      unit: "204",
      property: "Riverside Apartments",
      leaseEnd: "Dec 2025",
      paymentStatus: "paid" as const,
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "(555) 987-6543",
      unit: "105",
      property: "Downtown Luxury Suites",
      leaseEnd: "Mar 2026",
      paymentStatus: "pending" as const,
    },
    {
      id: "3",
      name: "Emma Williams",
      email: "emma.w@email.com",
      phone: "(555) 456-7890",
      unit: "312",
      property: "Riverside Apartments",
      leaseEnd: "Jan 2025",
      paymentStatus: "overdue" as const,
    },
    {
      id: "4",
      name: "David Martinez",
      email: "d.martinez@email.com",
      phone: "(555) 234-5678",
      unit: "501",
      property: "Urban Heights",
      leaseEnd: "Jun 2026",
      paymentStatus: "paid" as const,
    },
    {
      id: "5",
      name: "Lisa Anderson",
      email: "lisa.a@email.com",
      phone: "(555) 345-6789",
      unit: "208",
      property: "Meadow View Commons",
      leaseEnd: "Apr 2026",
      paymentStatus: "paid" as const,
    },
    {
      id: "6",
      name: "James Wilson",
      email: "j.wilson@email.com",
      phone: "(555) 567-8901",
      unit: "410",
      property: "Downtown Luxury Suites",
      leaseEnd: "Feb 2026",
      paymentStatus: "pending" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Tenants
          </h1>
          <p className="text-muted-foreground">
            Manage tenant information and leases
          </p>
        </div>
        <Button data-testid="button-add-tenant">
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-tenants"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            {...tenant}
            onViewDetails={() => console.log(`View tenant ${tenant.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
