import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  Calendar,
  DollarSign,
  Home,
  Phone,
  User,
  FileText,
  Download,
  Car,
  Square,
  MapPin,
  Clock,
  Mail,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import type { Tenant, Unit, Property, Document } from "@shared/schema";

export default function MyUnit() {
  // Fetch current user's data
  const { data: currentUser, isLoading: isUserLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch tenant information
  const { data: tenant, isLoading: isTenantLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenants/me"],
    enabled: !!currentUser && currentUser.role === "TENANT",
  });

  // Fetch unit details
  const { data: unit, isLoading: isUnitLoading } = useQuery<Unit>({
    queryKey: tenant ? [`/api/units/${tenant.unitId}`] : [],
    enabled: !!tenant?.unitId,
  });

  // Fetch property details
  const { data: property, isLoading: isPropertyLoading } = useQuery<Property>({
    queryKey: unit ? [`/api/properties/${unit.propertyId}`] : [],
    enabled: !!unit?.propertyId,
  });

  // Fetch unit documents
  const { data: documents = [], isLoading: isDocumentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", `unit=${unit?.id}`],
    enabled: !!unit?.id,
  });

  const isLoading = isUserLoading || isTenantLoading || isUnitLoading || isPropertyLoading || isDocumentsLoading;

  // Check if user is a tenant
  if (!isLoading && currentUser?.role !== "TENANT") {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This page is only accessible to tenants. Please log in with a tenant account.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-6">My Unit</h1>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!tenant || !unit) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load unit information. Please contact support if this issue persists.
        </AlertDescription>
      </Alert>
    );
  }

  const leaseStatus = new Date(tenant.leaseEndDate) > new Date() ? "active" : "expired";
  const daysUntilLeaseEnd = Math.floor((new Date(tenant.leaseEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Unit</h1>
        <p className="text-muted-foreground">View your unit details, lease information, and documents</p>
      </div>

      {/* Unit Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Unit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Unit Number:</span>
                <span>{unit.unitNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Property:</span>
                <span>{property?.name || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Floor:</span>
                <span>{unit.floor || "Ground"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Type:</span>
                <Badge variant="secondary">{unit.type}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Size:</span>
                <span>{unit.size} sq ft</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Bedrooms:</span>
                <span>{unit.bedrooms}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Bathrooms:</span>
                <span>{unit.bathrooms}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Parking:</span>
                <span>{unit.features?.includes("parking") ? "Assigned Slot" : "None"}</span>
              </div>
            </div>
          </div>
          {unit.features && unit.features.length > 0 && (
            <div className="pt-4 border-t">
              <p className="font-medium mb-2">Amenities:</p>
              <div className="flex flex-wrap gap-2">
                {unit.features.map((feature) => (
                  <Badge key={feature} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lease Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lease Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Lease Start:</span>
                <span>{format(new Date(tenant.leaseStartDate), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Lease End:</span>
                <span>{format(new Date(tenant.leaseEndDate), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status:</span>
                <Badge variant={leaseStatus === "active" ? "success" : "destructive"}>
                  {leaseStatus === "active" ? "Active" : "Expired"}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Monthly Rent:</span>
                <span className="text-lg font-semibold">${tenant.rentAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Security Deposit:</span>
                <span>${tenant.depositAmount.toFixed(2)}</span>
              </div>
              {daysUntilLeaseEnd <= 30 && daysUntilLeaseEnd > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your lease expires in {daysUntilLeaseEnd} days. Please contact management for renewal.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Property Manager
              </h4>
              <p className="text-sm text-muted-foreground">{property?.managerName || "Not assigned"}</p>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {property?.managerPhone || "N/A"}
              </p>
              <p className="text-sm flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {property?.managerEmail || "N/A"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Emergency Maintenance
              </h4>
              <p className="text-sm text-muted-foreground">24/7 Emergency Line</p>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-3 w-3" />
                1-800-EMERGENCY
              </p>
              <p className="text-sm text-muted-foreground">
                For urgent issues like water leaks, power outages, or security concerns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Unit Documents
            </div>
            <Button size="sm" variant="outline" data-testid="button-request-document">
              Request Document
            </Button>
          </CardTitle>
          <CardDescription>
            Access your lease agreement and other important documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    data-testid={`button-download-${doc.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No documents available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}