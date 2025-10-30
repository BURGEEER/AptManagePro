import { useState } from "react";
import { MaintenanceRequestCard } from "@/components/MaintenanceRequestCard";
import { UtilityReadingCard } from "@/components/UtilityReadingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Wrench, 
  Droplets, 
  Zap,
  Paintbrush,
  PipetteIcon,
  AlertCircle,
  Home,
  Wifi,
  FileText,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Maintenance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

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
      category: "plumbing",
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
      category: "electrical",
      createdAt: "5 hours ago",
    },
    {
      id: "3",
      title: "Wall Cracks",
      description: "Multiple cracks appearing on bedroom wall, needs assessment.",
      property: "Urban Heights",
      unit: "501",
      tenant: "David Martinez",
      status: "submitted" as const,
      priority: "medium" as const,
      category: "civil",
      createdAt: "1 day ago",
    },
    {
      id: "4",
      title: "Floor Drain Blocked",
      description: "Bathroom floor drain is completely blocked causing water backup.",
      property: "Riverside Apartments",
      unit: "312",
      tenant: "Emma Williams",
      status: "in-progress" as const,
      priority: "high" as const,
      category: "plumbing",
      createdAt: "3 hours ago",
    },
    {
      id: "5",
      title: "Intercom System Dead",
      description: "Intercom system not working, cannot receive calls from lobby.",
      property: "Downtown Luxury Suites",
      unit: "410",
      tenant: "James Wilson",
      status: "submitted" as const,
      priority: "low" as const,
      category: "intercom",
      createdAt: "6 hours ago",
    },
  ];

  const utilityReadings = [
    {
      id: "1",
      unit: "204",
      property: "Riverside Apartments",
      waterReading: 145,
      electricReading: 890,
      previousWater: 132,
      previousElectric: 820,
      readingDate: "Dec 20, 2024",
      status: "normal" as const,
    },
    {
      id: "2",
      unit: "105",
      property: "Downtown Luxury Suites",
      waterReading: 198,
      electricReading: 1250,
      previousWater: 165,
      previousElectric: 1100,
      readingDate: "Dec 20, 2024",
      status: "high" as const,
    },
    {
      id: "3",
      unit: "312",
      property: "Riverside Apartments",
      waterReading: 220,
      electricReading: 980,
      previousWater: 178,
      previousElectric: 850,
      readingDate: "Dec 20, 2024",
      status: "warning" as const,
    },
  ];

  const categoryIcons: { [key: string]: JSX.Element } = {
    civil: <Paintbrush className="h-4 w-4" />,
    plumbing: <PipetteIcon className="h-4 w-4" />,
    electrical: <Zap className="h-4 w-4" />,
    waterLeak: <Droplets className="h-4 w-4" />,
    flooring: <Home className="h-4 w-4" />,
    intercom: <Wifi className="h-4 w-4" />,
  };

  const requestsByCategory = {
    civil: 8,
    plumbing: 12,
    electrical: 7,
    waterLeak: 3,
    flooring: 2,
    intercom: 4,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Maintenance & Utilities
          </h1>
          <p className="text-muted-foreground">
            Track maintenance requests and utility consumption
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-concern-template">
            <FileText className="h-4 w-4 mr-2" />
            Concern Template
          </Button>
          <Button data-testid="button-create-request">
            <Plus className="h-4 w-4 mr-2" />
            File Unit Concern
          </Button>
        </div>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(requestsByCategory).map(([category, count]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                <div className="flex items-center gap-2">
                  {categoryIcons[category]}
                  <span>{category}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{count}</div>
              <p className="text-xs text-muted-foreground">active</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" data-testid="tab-requests">
            <Wrench className="h-4 w-4 mr-2" />
            Maintenance Requests
            <Badge variant="secondary" className="ml-2">
              {requests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="utilities" data-testid="tab-utilities">
            <Droplets className="h-4 w-4 mr-2" />
            Utility Readings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Notification Banner */}
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-base">New Unit Concerns</CardTitle>
                  <Badge variant="destructive">5 new</Badge>
                </div>
                <Button size="sm" variant="outline">View All</Button>
              </div>
            </CardHeader>
          </Card>

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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40" data-testid="select-filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="waterLeak">Water Leak</SelectItem>
                <SelectItem value="flooring">Flooring</SelectItem>
                <SelectItem value="intercom">Intercom</SelectItem>
              </SelectContent>
            </Select>
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
        </TabsContent>

        <TabsContent value="utilities" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Water & Electric Consumption</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" data-testid="button-record-reading">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Reading
                </Button>
                <Button size="sm" variant="outline" data-testid="button-export-readings">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monthly utility consumption tracking and analysis
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {utilityReadings.map((reading) => (
              <UtilityReadingCard key={reading.id} {...reading} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}