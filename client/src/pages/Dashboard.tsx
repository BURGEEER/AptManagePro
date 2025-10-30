import { StatCard } from "@/components/StatCard";
import { PropertyCard } from "@/components/PropertyCard";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { RevenueChart } from "@/components/RevenueChart";
import { OccupancyChart } from "@/components/OccupancyChart";
import { Building2, Users, DollarSign, Wrench, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import modernBuilding from "@assets/generated_images/Modern_apartment_building_exterior_f859cd14.png";
import luxuryComplex from "@assets/generated_images/Luxury_apartment_complex_exterior_a666ca82.png";
import urbanBuilding from "@assets/generated_images/Urban_apartment_building_facade_39768cdb.png";

export default function Dashboard() {
  const revenueData = [
    { month: "Jul", revenue: 245000 },
    { month: "Aug", revenue: 268000 },
    { month: "Sep", revenue: 255000 },
    { month: "Oct", revenue: 278000 },
    { month: "Nov", revenue: 292000 },
    { month: "Dec", revenue: 284500 },
  ];

  const occupancyData = [
    { month: "Jul", rate: 88 },
    { month: "Aug", rate: 91 },
    { month: "Sep", rate: 89 },
    { month: "Oct", rate: 92 },
    { month: "Nov", rate: 94 },
    { month: "Dec", rate: 93 },
  ];

  const upcomingEvents = [
    { id: "1", title: "SOA Release", date: "Dec 28, 2024", type: "billing" },
    { id: "2", title: "Generator Maintenance", date: "Jan 5, 2025", type: "maintenance" },
    { id: "3", title: "Fire Drill", date: "Jan 10, 2025", type: "safety" },
    { id: "4", title: "Quarterly Inspection", date: "Jan 15, 2025", type: "inspection" },
  ];

  const announcements = [
    {
      id: "1",
      title: "Preventive Maintenance - Elevators",
      description: "Scheduled elevator maintenance on all buildings from 9 AM to 12 PM. Please use stairs during this period.",
      category: "maintenance" as const,
      date: "Dec 20, 2024",
      priority: "normal" as const,
    },
    {
      id: "2",
      title: "Power Interruption Notice",
      description: "Power will be temporarily interrupted on Building A from 10 PM to 2 AM for electrical upgrades.",
      category: "power" as const,
      date: "Dec 22, 2024",
      priority: "urgent" as const,
    },
    {
      id: "3",
      title: "Pool Area Repairs",
      description: "Swimming pool will be closed for repairs and cleaning. Expected to reopen on Dec 25.",
      category: "repair" as const,
      date: "Dec 18, 2024",
      priority: "normal" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your property portfolio and key metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Announcements & Advisories</CardTitle>
              <Button size="sm" variant="outline" data-testid="button-add-announcement">
                Add New
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} {...announcement} />
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={revenueData} />
            <OccupancyChart data={occupancyData} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  data-testid={`event-${event.id}`}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Delinquent Accounts</span>
                  <Badge variant="destructive">4</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Urgent Maintenance</span>
                  <Badge variant="destructive">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expiring Leases</span>
                  <Badge variant="secondary">7</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PropertyCard
              id="1"
              name="Riverside Apartments"
              address="123 River St, Portland, OR"
              image={modernBuilding}
              totalUnits={48}
              occupiedUnits={45}
              monthlyRevenue={72000}
              occupancyRate={94}
              onViewDetails={() => console.log("View property 1")}
            />
            <PropertyCard
              id="2"
              name="Downtown Luxury Suites"
              address="456 Main Ave, Portland, OR"
              image={luxuryComplex}
              totalUnits={32}
              occupiedUnits={28}
              monthlyRevenue={98000}
              occupancyRate={88}
              onViewDetails={() => console.log("View property 2")}
            />
            <PropertyCard
              id="3"
              name="Urban Heights"
              address="789 Park Blvd, Portland, OR"
              image={urbanBuilding}
              totalUnits={64}
              occupiedUnits={58}
              monthlyRevenue={114500}
              occupancyRate={91}
              onViewDetails={() => console.log("View property 3")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}