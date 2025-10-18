import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building2 } from "lucide-react";

interface TenantCardProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  property: string;
  leaseEnd: string;
  paymentStatus: "paid" | "pending" | "overdue";
  onViewDetails?: () => void;
}

export function TenantCard({
  id,
  name,
  email,
  phone,
  unit,
  property,
  leaseEnd,
  paymentStatus,
  onViewDetails,
}: TenantCardProps) {
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-tenant-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-sm">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold" data-testid={`text-tenant-name-${id}`}>
                {name}
              </h3>
              <Badge
                className={getStatusColor(paymentStatus)}
                data-testid={`badge-payment-${id}`}
              >
                {paymentStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span data-testid={`text-unit-${id}`}>
                {property} - Unit {unit}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate" data-testid={`text-email-${id}`}>
              {email}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span data-testid={`text-phone-${id}`}>{phone}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Lease ends: </span>
            <span className="font-medium" data-testid={`text-lease-end-${id}`}>
              {leaseEnd}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            data-testid={`button-view-tenant-${id}`}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
