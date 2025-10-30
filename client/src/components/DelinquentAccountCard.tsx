import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User, Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DelinquentAccountCardProps {
  id: string;
  ownerName: string;
  unit: string;
  property: string;
  totalOwed: number;
  monthsOverdue: number;
  lastPayment: string;
  status: "warning" | "critical" | "legal";
}

export function DelinquentAccountCard({
  id,
  ownerName,
  unit,
  property,
  totalOwed,
  monthsOverdue,
  lastPayment,
  status,
}: DelinquentAccountCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "warning":
        return "text-chart-3 bg-chart-3/10";
      case "critical":
        return "text-chart-5 bg-chart-5/10";
      case "legal":
        return "text-destructive bg-destructive/10";
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
    <Card className="hover-elevate border-l-4 border-l-destructive" data-testid={`card-delinquent-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(ownerName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold" data-testid={`text-owner-name-${id}`}>
                  {ownerName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {property} - Unit {unit}
                </p>
              </div>
              <Badge className={getStatusColor()} data-testid={`badge-status-${id}`}>
                {status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span>{monthsOverdue} months overdue</span>
            </div>
            <div className="text-2xl font-semibold font-mono text-destructive">
              ${totalOwed.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Last payment: {lastPayment}</span>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            data-testid={`button-send-notice-${id}`}
          >
            Send Notice
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            data-testid={`button-view-details-${id}`}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}