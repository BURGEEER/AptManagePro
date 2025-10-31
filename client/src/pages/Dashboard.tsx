import { useState, useMemo } from "react";
import { StatCard } from "@/components/StatCard";
import { PropertyCard } from "@/components/PropertyCard";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { RevenueChart } from "@/components/RevenueChart";
import { OccupancyChart } from "@/components/OccupancyChart";
import { Building2, Users, DollarSign, Wrench, Calendar, AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import type { Announcement, Property, MaintenanceRequest, Owner, Transaction, Tenant, Unit } from "@shared/schema";
import modernBuilding from "@assets/generated_images/Modern_apartment_building_exterior_f859cd14.png";
import luxuryComplex from "@assets/generated_images/Luxury_apartment_complex_exterior_a666ca82.png";
import urbanBuilding from "@assets/generated_images/Urban_apartment_building_facade_39768cdb.png";

// Types for dashboard statistics
interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  totalTenants: number;
  openRequests: number;
}

export default function Dashboard() {
  // Fetch current user for role-specific content
  const { data: currentUser, isLoading: isUserLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch announcements
  const { data: announcements = [], isLoading: isAnnouncementsLoading, error: announcementsError } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    enabled: !!currentUser,
  });

  // Fetch properties
  const { data: properties = [], isLoading: isPropertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: !!currentUser && (currentUser?.role === "IT" || currentUser?.role === "ADMIN"),
  });

  // Fetch maintenance requests
  const { data: maintenanceRequests = [], isLoading: isMaintenanceLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance-requests"],
    enabled: !!currentUser && (currentUser?.role === "IT" || currentUser?.role === "ADMIN"),
  });

  // Fetch owners
  const { data: owners = [], isLoading: isOwnersLoading } = useQuery<Owner[]>({
    queryKey: ["/api/owners"],
    enabled: !!currentUser && (currentUser?.role === "IT" || currentUser?.role === "ADMIN"),
  });

  // Fetch tenants
  const { data: tenants = [], isLoading: isTenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
    enabled: !!currentUser && (currentUser?.role === "IT" || currentUser?.role === "ADMIN"),
  });

  // Fetch units
  const { data: units = [], isLoading: isUnitsLoading } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
    enabled: !!currentUser && (currentUser?.role === "IT" || currentUser?.role === "ADMIN"),
  });

  // Fetch transactions for revenue calculation
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!currentUser && (currentUser?.role === "IT" || currentUser?.role === "ADMIN"),
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    const openRequests = maintenanceRequests.filter(r => r.status === "submitted" || r.status === "in-progress").length;
    const urgentRequests = maintenanceRequests.filter(r => r.priority === "urgent" && r.status !== "resolved").length;
    const occupiedUnits = units.filter(u => u.status === "occupied").length;
    const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;
    
    // Calculate monthly revenue from completed transactions in current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = transactions.filter(t => {
      if (t.status === "completed" && t.paidDate) {
        const paidDate = new Date(t.paidDate);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      }
      return false;
    });
    
    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calculate delinquent accounts (overdue transactions)
    const today = new Date();
    const delinquentAccounts = transactions.filter(t => {
      if (t.status === "pending" && t.dueDate) {
        const dueDate = new Date(t.dueDate);
        return dueDate < today;
      }
      return false;
    }).length;

    // Calculate expiring leases (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringLeases = tenants.filter(t => {
      const leaseEnd = new Date(t.leaseEndDate);
      return leaseEnd >= today && leaseEnd <= thirtyDaysFromNow && t.status === "active";
    }).length;

    return {
      totalProperties: properties.length,
      totalTenants: tenants.length + owners.filter(o => o.type === "tenant").length,
      totalOwners: owners.filter(o => o.type === "owner").length,
      monthlyRevenue,
      openRequests,
      urgentRequests,
      occupiedUnits,
      totalUnits: units.length,
      occupancyRate,
      delinquentAccounts,
      expiringLeases,
    };
  }, [properties, owners, tenants, maintenanceRequests, transactions, units]);

  // Generate revenue chart data from transactions
  const revenueData = useMemo(() => {
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthNum = index + 6; // July = 6, August = 7, etc.
      const monthTransactions = transactions.filter(t => {
        if (t.status === "completed" && t.paidDate) {
          const paidDate = new Date(t.paidDate);
          return paidDate.getMonth() === monthNum && paidDate.getFullYear() === currentYear;
        }
        return false;
      });
      
      const revenue = monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      return { month, revenue };
    });
  }, [transactions]);

  // Generate occupancy data
  const occupancyData = useMemo(() => {
    // For now, we'll use static data since we don't have historical occupancy tracking
    // In a real app, you'd track occupancy over time
    return [
      { month: "Jul", rate: 88 },
      { month: "Aug", rate: 91 },
      { month: "Sep", rate: 89 },
      { month: "Oct", rate: 92 },
      { month: "Nov", rate: 94 },
      { month: "Dec", rate: statistics.occupancyRate },
    ];
  }, [statistics.occupancyRate]);

  // Format announcements for display
  const formattedAnnouncements = useMemo(() => {
    return announcements.slice(0, 3).map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      category: announcement.category as "maintenance" | "power" | "repair" | "general",
      date: new Date(announcement.startDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      priority: announcement.priority as "normal" | "urgent",
    }));
  }, [announcements]);

  // Sample upcoming events (could be fetched from a calendar API in a real app)
  const upcomingEvents = [
    { id: "1", title: "SOA Release", date: "Dec 28, 2024", type: "billing" },
    { id: "2", title: "Generator Maintenance", date: "Jan 5, 2025", type: "maintenance" },
    { id: "3", title: "Fire Drill", date: "Jan 10, 2025", type: "safety" },
    { id: "4", title: "Quarterly Inspection", date: "Jan 15, 2025", type: "inspection" },
  ];

  const isLoadingStats = isPropertiesLoading || isOwnersLoading || isTenantsLoading || 
                         isMaintenanceLoading || isTransactionsLoading || isUnitsLoading;

  // Only show full dashboard for IT and ADMIN roles
  const showFullDashboard = currentUser?.role === "IT" || currentUser?.role === "ADMIN";

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
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
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            {showFullDashboard 
              ? "Overview of your property portfolio and key metrics"
              : "Welcome to your property management portal"}
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

      {showFullDashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingStats ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))
          ) : (
            <>
              <StatCard
                title="Total Properties"
                value={statistics.totalProperties.toString()}
                icon={Building2}
                trend={{ value: 8.2, isPositive: true }}
              />
              <StatCard
                title={currentUser?.role === "ADMIN" ? "Total Tenants" : "Total Owners/Tenants"}
                value={(statistics.totalTenants + (currentUser?.role === "IT" ? statistics.totalOwners : 0)).toString()}
                icon={Users}
                trend={{ value: 3.1, isPositive: true }}
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${statistics.monthlyRevenue.toLocaleString()}`}
                icon={DollarSign}
                trend={{ value: 12.5, isPositive: true }}
              />
              <StatCard
                title="Open Requests"
                value={statistics.openRequests.toString()}
                icon={Wrench}
                trend={{ value: 5.3, isPositive: statistics.openRequests === 0 }}
              />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Announcements & Advisories</CardTitle>
              {(currentUser?.role === "IT" || currentUser?.role === "ADMIN") && (
                <Button size="sm" variant="outline" data-testid="button-add-announcement">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isAnnouncementsLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))
              ) : announcementsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load announcements. Please try refreshing the page.
                  </AlertDescription>
                </Alert>
              ) : formattedAnnouncements.length > 0 ? (
                formattedAnnouncements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} {...announcement} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No announcements at this time
                </p>
              )}
            </CardContent>
          </Card>

          {showFullDashboard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={revenueData} />
              <OccupancyChart data={occupancyData} />
            </div>
          )}
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

          {showFullDashboard && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingStats ? (
                  <Skeleton className="h-20" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Delinquent Accounts</span>
                      <Badge variant={statistics.delinquentAccounts > 0 ? "destructive" : "secondary"}>
                        {statistics.delinquentAccounts}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Urgent Maintenance</span>
                      <Badge variant={statistics.urgentRequests > 0 ? "destructive" : "secondary"}>
                        {statistics.urgentRequests}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expiring Leases</span>
                      <Badge variant={statistics.expiringLeases > 3 ? "secondary" : "outline"}>
                        {statistics.expiringLeases}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showFullDashboard && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {isPropertiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.slice(0, 3).map((property, index) => {
                  const propertyUnits = units.filter(u => u.propertyId === property.id);
                  const occupiedUnits = propertyUnits.filter(u => u.status === "occupied").length;
                  const occupancyRate = propertyUnits.length > 0 
                    ? Math.round((occupiedUnits / propertyUnits.length) * 100)
                    : 0;
                  
                  // Calculate property revenue
                  const propertyRevenue = propertyUnits
                    .filter(u => u.status === "occupied")
                    .reduce((sum, unit) => sum + parseFloat(unit.monthlyRent), 0);

                  const images = [modernBuilding, luxuryComplex, urbanBuilding];
                  
                  return (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      name={property.name}
                      address={`${property.address}, ${property.city}, ${property.state}`}
                      image={property.imageUrl || images[index % 3]}
                      totalUnits={property.totalUnits}
                      occupiedUnits={occupiedUnits}
                      monthlyRevenue={propertyRevenue}
                      occupancyRate={occupancyRate}
                      onViewDetails={() => console.log("View property", property.id)}
                    />
                  );
                }).concat(
                  // If no properties, show sample cards
                  properties.length === 0 ? [
                    <PropertyCard
                      key="sample-1"
                      id="1"
                      name="Sample Property"
                      address="123 Demo St, City, State"
                      image={modernBuilding}
                      totalUnits={48}
                      occupiedUnits={45}
                      monthlyRevenue={72000}
                      occupancyRate={94}
                      onViewDetails={() => console.log("View sample property")}
                    />
                  ] : []
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}