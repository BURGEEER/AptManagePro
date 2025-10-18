import { StatCard } from "@/components/StatCard";
import { PropertyCard } from "@/components/PropertyCard";
import { MaintenanceRequestCard } from "@/components/MaintenanceRequestCard";
import { RevenueChart } from "@/components/RevenueChart";
import { OccupancyChart } from "@/components/OccupancyChart";
import { Building2, Users, DollarSign, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your property portfolio and key metrics
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <OccupancyChart data={occupancyData} />
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MaintenanceRequestCard
              id="1"
              title="Leaking Faucet"
              description="Kitchen faucet has been dripping constantly for the past two days."
              property="Riverside Apartments"
              unit="204"
              tenant="Sarah Johnson"
              status="in-progress"
              priority="high"
              createdAt="2 hours ago"
              onViewDetails={() => console.log("View request 1")}
            />
            <MaintenanceRequestCard
              id="2"
              title="AC Not Working"
              description="Air conditioning unit stopped working. Room temperature is uncomfortable."
              property="Downtown Luxury Suites"
              unit="105"
              tenant="Michael Chen"
              status="submitted"
              priority="medium"
              createdAt="5 hours ago"
              onViewDetails={() => console.log("View request 2")}
            />
            <MaintenanceRequestCard
              id="3"
              title="Light Bulb Replacement"
              description="Hallway light bulb needs replacement."
              property="Riverside Apartments"
              unit="312"
              tenant="Emma Williams"
              status="resolved"
              priority="low"
              createdAt="1 day ago"
              onViewDetails={() => console.log("View request 3")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
