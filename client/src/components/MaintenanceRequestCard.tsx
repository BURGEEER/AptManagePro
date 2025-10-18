import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User } from "lucide-react";

interface MaintenanceRequestCardProps {
  id: string;
  title: string;
  description: string;
  property: string;
  unit: string;
  tenant: string;
  status: "submitted" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  onViewDetails?: () => void;
}

export function MaintenanceRequestCard({
  id,
  title,
  description,
  property,
  unit,
  tenant,
  status,
  priority,
  createdAt,
  onViewDetails,
}: MaintenanceRequestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "text-chart-2 bg-chart-2/10";
      case "in-progress":
        return "text-chart-1 bg-chart-1/10";
      case "submitted":
        return "text-muted-foreground bg-muted";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-chart-5 bg-chart-5/10";
      case "medium":
        return "text-chart-3 bg-chart-3/10";
      case "low":
        return "text-muted-foreground bg-muted";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className="hover-elevate" data-testid={`card-maintenance-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold" data-testid={`text-maintenance-title-${id}`}>
            {title}
          </h3>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(priority)} data-testid={`badge-priority-${id}`}>
              {priority}
            </Badge>
            <Badge className={getStatusColor(status)} data-testid={`badge-status-${id}`}>
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${id}`}>
          {description}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span data-testid={`text-location-${id}`}>
              {property} - Unit {unit}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3 w-3" />
            <span data-testid={`text-tenant-${id}`}>{tenant}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span data-testid={`text-created-${id}`}>{createdAt}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onViewDetails}
          data-testid={`button-view-maintenance-${id}`}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
