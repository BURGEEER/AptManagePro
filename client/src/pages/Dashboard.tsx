import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { StatCard } from "@/components/StatCard";
import { PropertyCard } from "@/components/PropertyCard";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { RevenueChart } from "@/components/RevenueChart";
import { OccupancyChart } from "@/components/OccupancyChart";
import { 
  Building2, 
  Users, 
  DollarSign, 
  Wrench, 
  Calendar, 
  AlertCircle, 
  Plus, 
  Shield, 
  AlertTriangle, 
  Activity,
  CreditCard,
  FileText,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Receipt,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Announcement, Property, MaintenanceRequest, Owner, Transaction, Tenant, Unit, AuditLog } from "@shared/schema";
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
  const [, setLocation] = useLocation();
  
  // Fetch current user for role-specific content
  const { data: currentUser, isLoading: isUserLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch announcements
  const { data: announcements = [], isLoading: isAnnouncementsLoading, error: announcementsError } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    enabled: !!currentUser,
  });

  // TENANT SPECIFIC QUERIES
  // Fetch tenant information
  const { data: tenantInfo, isLoading: isTenantInfoLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenants/me"],
    enabled: !!currentUser && currentUser?.role === "TENANT",
  });

  // Fetch tenant's unit
  const { data: tenantUnit, isLoading: isTenantUnitLoading } = useQuery<Unit>({
    queryKey: tenantInfo ? [`/api/units/${tenantInfo.unitId}`] : [],
    enabled: !!tenantInfo?.unitId,
  });

  // Fetch tenant's property
  const { data: tenantProperty, isLoading: isTenantPropertyLoading } = useQuery<Property>({
    queryKey: tenantUnit ? [`/api/properties/${tenantUnit.propertyId}`] : [],
    enabled: !!tenantUnit?.propertyId,
  });

  // Fetch tenant's transactions
  const { data: tenantTransactions = [], isLoading: isTenantTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/me"],
    enabled: !!currentUser && currentUser?.role === "TENANT",
  });

  // Fetch tenant's maintenance requests
  const { data: tenantMaintenanceRequests = [], isLoading: isTenantMaintenanceLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance-requests/me"],
    enabled: !!currentUser && currentUser?.role === "TENANT",
  });

  // ADMIN/IT SPECIFIC QUERIES
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

  // Fetch recent audit logs for IT and Admin users
  const { data: recentAuditLogs = [], isLoading: isAuditLogsLoading } = useQuery<any[]>({
    queryKey: ["/api/audit-logs", "limit=10"],
    enabled: !!currentUser && (currentUser?.role === "IT" || currentUser?.role === "ADMIN"),
  });

  // Fetch audit log statistics
  const { data: auditStats } = useQuery<any>({
    queryKey: ["/api/audit-logs/stats"],
    enabled: !!currentUser && (currentUser?.role === "IT" || currentUser?.role === "ADMIN"),
  });

  // Calculate tenant statistics
  const tenantStatistics = useMemo(() => {
    if (currentUser?.role !== "TENANT") return null;

    const today = new Date();
    
    // Calculate outstanding balance
    const outstandingBalance = tenantTransactions
      .filter(t => t.status === "pending")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Get overdue payments
    const overduePayments = tenantTransactions
      .filter(t => {
        if (t.status === "pending" && t.dueDate) {
          return new Date(t.dueDate) < today;
        }
        return false;
      });

    // Get next payment due date
    const upcomingPayments = tenantTransactions
      .filter(t => t.status === "pending" && t.dueDate && new Date(t.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    const nextPaymentDue = upcomingPayments[0];

    // Get recent payments
    const recentPayments = tenantTransactions
      .filter(t => t.status === "completed")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Maintenance request stats
    const openMaintenanceRequests = tenantMaintenanceRequests.filter(
      r => r.status === "submitted" || r.status === "in-progress"
    ).length;

    const resolvedMaintenanceRequests = tenantMaintenanceRequests.filter(
      r => r.status === "resolved" || r.status === "closed"
    ).length;

    // Lease information
    const leaseEndDate = tenantInfo ? new Date(tenantInfo.leaseEndDate) : null;
    const daysUntilLeaseEnd = leaseEndDate 
      ? Math.floor((leaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      outstandingBalance,
      overduePayments,
      nextPaymentDue,
      recentPayments,
      openMaintenanceRequests,
      resolvedMaintenanceRequests,
      daysUntilLeaseEnd,
      monthlyRent: tenantInfo?.monthlyRent ? parseFloat(tenantInfo.monthlyRent) : 0,
    };
  }, [tenantTransactions, tenantMaintenanceRequests, tenantInfo, currentUser?.role]);

  // Calculate statistics for admin/IT
  const statistics = useMemo(() => {
    const openRequests = maintenanceRequests.filter(r => r.status === "submitted" || r.status === "in-progress").length;
    const urgentRequests = maintenanceRequests.filter(r => r.priority === "urgent" && r.status !== "resolved").length;
    const occupiedUnits = units.filter(u => u.status === "occupied").length;
    const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;
    
    // Calculate monthly revenue from completed transactions in current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = transactions.filter(t => {
      if (t.status === "completed" && t.date) {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
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
      openRequests,
      urgentRequests,
      monthlyRevenue,
      delinquentAccounts,
      expiringLeases,
      occupiedUnits,
      occupancyRate,
      totalUnits: units.length,
    };
  }, [properties, owners, tenants, maintenanceRequests, transactions, units]);

  // Generate revenue chart data
  const revenueData = useMemo(() => {
    return [
      { month: "Jan", revenue: 285000 },
      { month: "Feb", revenue: 292000 },
      { month: "Mar", revenue: 298000 },
      { month: "Apr", revenue: 302000 },
      { month: "May", revenue: 308000 },
      { month: "Jun", revenue: 315000 },
    ];
  }, []);

  // Generate occupancy chart data
  const occupancyData = useMemo(() => {
    // Generate mock monthly occupancy data for the chart
    const currentRate = statistics.occupancyRate;
    return [
      { month: "Jan", rate: Math.max(currentRate - 5, 0) },
      { month: "Feb", rate: Math.max(currentRate - 3, 0) },
      { month: "Mar", rate: Math.max(currentRate - 2, 0) },
      { month: "Apr", rate: Math.max(currentRate - 1, 0) },
      { month: "May", rate: currentRate },
      { month: "Jun", rate: currentRate },
    ];
  }, [statistics.occupancyRate]);

  // Format announcements for display
  const formattedAnnouncements = useMemo(() => {
    return announcements.slice(0, 3).map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      description: announcement.content,
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

  const isTenantLoading = isTenantInfoLoading || isTenantUnitLoading || isTenantPropertyLoading || 
                          isTenantTransactionsLoading || isTenantMaintenanceLoading;

  // Only show full dashboard for IT and ADMIN roles
  const showFullDashboard = currentUser?.role === "IT" || currentUser?.role === "ADMIN";
  const isTenant = currentUser?.role === "TENANT";

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

  // TENANT DASHBOARD
  if (isTenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" data-testid="text-page-title">
              Welcome, {tenantInfo?.name || currentUser?.fullName || 'Tenant'}!
            </h1>
            <p className="text-muted-foreground">
              Your property management portal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            size="lg" 
            className="h-auto flex flex-col items-center gap-2 p-4"
            onClick={() => setLocation("/payment-history")}
            data-testid="button-pay-rent"
          >
            <CreditCard className="h-6 w-6" />
            <div>
              <p className="font-semibold">Pay Rent</p>
              <p className="text-xs opacity-90">Make a payment</p>
            </div>
          </Button>
          <Button 
            size="lg" 
            variant="secondary"
            className="h-auto flex flex-col items-center gap-2 p-4"
            onClick={() => setLocation("/maintenance")}
            data-testid="button-request-maintenance"
          >
            <Wrench className="h-6 w-6" />
            <div>
              <p className="font-semibold">Request Maintenance</p>
              <p className="text-xs opacity-90">Submit a new request</p>
            </div>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-auto flex flex-col items-center gap-2 p-4"
            onClick={() => setLocation("/my-documents")}
            data-testid="button-view-documents"
          >
            <FileText className="h-6 w-6" />
            <div>
              <p className="font-semibold">View Documents</p>
              <p className="text-xs opacity-90">Access your files</p>
            </div>
          </Button>
        </div>

        {/* Statistics Cards */}
        {isTenantLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ${tenantStatistics?.outstandingBalance.toFixed(2) || "0.00"}
                </p>
                {tenantStatistics?.overduePayments && tenantStatistics.overduePayments.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {tenantStatistics.overduePayments.length} overdue payment(s)
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Next Payment Due</CardTitle>
              </CardHeader>
              <CardContent>
                {tenantStatistics?.nextPaymentDue ? (
                  <>
                    <p className="text-2xl font-bold">
                      ${parseFloat(tenantStatistics.nextPaymentDue.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due {format(new Date(tenantStatistics.nextPaymentDue.dueDate!), "MMM dd, yyyy")}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming payments</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tenantStatistics?.openMaintenanceRequests || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tenantStatistics?.resolvedMaintenanceRequests || 0} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lease Status</CardTitle>
              </CardHeader>
              <CardContent>
                {tenantStatistics && tenantStatistics.daysUntilLeaseEnd !== null && tenantStatistics.daysUntilLeaseEnd > 0 ? (
                  <>
                    <p className="text-2xl font-bold">{tenantStatistics.daysUntilLeaseEnd}</p>
                    <p className="text-xs text-muted-foreground mt-1">days until renewal</p>
                    {tenantStatistics.daysUntilLeaseEnd <= 30 && (
                      <Badge variant="secondary" className="mt-2">Renewal Soon</Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="destructive">Expired</Badge>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Unit Information */}
            {!isTenantLoading && tenantUnit && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Your Unit Information
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setLocation("/my-unit")}
                    data-testid="button-view-unit-details"
                  >
                    View Details
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Unit Number</p>
                      <p className="font-medium">{tenantUnit.unitNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Property</p>
                      <p className="font-medium">{tenantProperty?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="font-medium text-lg">${tenantStatistics?.monthlyRent.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge variant="secondary">{tenantUnit.bedrooms} BR</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Payment History */}
            {!isTenantLoading && tenantStatistics?.recentPayments && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Recent Payments
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLocation("/payment-history")}
                    data-testid="button-view-all-payments"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {tenantStatistics.recentPayments.length > 0 ? (
                    <div className="space-y-3">
                      {tenantStatistics.recentPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{payment.description || "Monthly Rent"}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.date), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${parseFloat(payment.amount).toFixed(2)}</p>
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No recent payments</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Maintenance Requests */}
            {!isTenantLoading && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Recent Maintenance Requests
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLocation("/maintenance")}
                    data-testid="button-view-all-requests"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {tenantMaintenanceRequests.length > 0 ? (
                    <div className="space-y-3">
                      {tenantMaintenanceRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{request.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(request.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              request.status === "resolved" ? "default" :
                              request.status === "in-progress" ? "secondary" :
                              "outline"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No maintenance requests</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Important Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAnnouncementsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))
                ) : formattedAnnouncements.length > 0 ? (
                  formattedAnnouncements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="p-3 rounded-lg bg-muted/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{announcement.title}</p>
                        {announcement.priority === "urgent" && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {announcement.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{announcement.date}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No announcements at this time
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
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

            {/* Quick Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setLocation("/communications")}
                  data-testid="button-contact-admin"
                >
                  Contact Administration
                </Button>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Emergency Hotline</p>
                  <p className="font-semibold">1-800-EMERGENCY</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN/IT DASHBOARD (existing code)
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
            <>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Audit Activity
                  </CardTitle>
                  <CardDescription>
                    Recent system activity and security events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isAuditLogsLoading ? (
                    <Skeleton className="h-20" />
                  ) : (
                    <div className="space-y-3">
                      {auditStats && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <div className="text-2xl font-bold">
                              {auditStats.totalActions || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Today's Actions</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
                            <div className="text-2xl font-bold text-destructive">
                              {auditStats.failedLogins || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Failed Logins</p>
                          </div>
                        </div>
                      )}
                      
                      {recentAuditLogs.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Recent Critical Actions
                          </p>
                          {recentAuditLogs.slice(0, 5).map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Badge 
                                  variant={
                                    log.action === "DELETE" ? "destructive" :
                                    log.action === "CREATE" ? "default" :
                                    log.action === "LOGIN_FAILED" ? "destructive" :
                                    "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {log.action}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {log.userName} • {log.entityType}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.createdAt), "HH:mm")}
                              </span>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            data-testid="button-view-all-logs"
                            onClick={() => window.location.href = "/audit-logs"}
                          >
                            View All Logs
                          </Button>
                        </div>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          No recent audit activity
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
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