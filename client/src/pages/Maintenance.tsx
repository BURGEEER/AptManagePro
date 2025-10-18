import { useState } from "react";
import { MaintenanceRequestCard } from "@/components/MaintenanceRequestCard";
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

export default function Maintenance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const requests = [
    {
      id: "1",
      title: "Leaking Faucet",
      description: "Kitchen faucet has been dripping constantly for the past two days. Need urgent repair.",
      property: "Riverside Apartments",
      unit: "204",
      tenant: "Sarah Johnson",
      status: "in-progress" as const,
      priority: "high" as const,
      createdAt: "2 hours ago",
    },
    {
      id: "2",
      title: "AC Not Working",
      description: "Air conditioning unit stopped working. Room temperature is uncomfortable.",
      property: "Downtown Luxury Suites",
      unit: "105",
      tenant: "Michael Chen",
      status: "submitted" as const,
      priority: "medium" as const,
      createdAt: "5 hours ago",
    },
    {
      id: "3",
      title: "Light Bulb Replacement",
      description: "Hallway light bulb needs replacement.",
      property: "Riverside Apartments",
      unit: "312",
      tenant: "Emma Williams",
      status: "resolved" as const,
      priority: "low" as const,
      createdAt: "1 day ago",
    },
    {
      id: "4",
      title: "Broken Window",
      description: "Bedroom window cracked during recent storm.",
      property: "Urban Heights",
      unit: "501",
      tenant: "David Martinez",
      status: "submitted" as const,
      priority: "high" as const,
      createdAt: "3 hours ago",
    },
    {
      id: "5",
      title: "Heating Issue",
      description: "Heater making strange noise and not warming properly.",
      property: "Meadow View Commons",
      unit: "208",
      tenant: "Lisa Anderson",
      status: "in-progress" as const,
      priority: "medium" as const,
      createdAt: "1 day ago",
    },
    {
      id: "6",
      title: "Garbage Disposal Jam",
      description: "Garbage disposal is jammed and not working.",
      property: "Downtown Luxury Suites",
      unit: "410",
      tenant: "James Wilson",
      status: "submitted" as const,
      priority: "low" as const,
      createdAt: "6 hours ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Maintenance Requests
          </h1>
          <p className="text-muted-foreground">
            Track and manage maintenance requests
          </p>
        </div>
        <Button data-testid="button-create-request">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-requests"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((request) => (
          <MaintenanceRequestCard
            key={request.id}
            {...request}
            onViewDetails={() => console.log(`View request ${request.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
