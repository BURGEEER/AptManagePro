import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, DollarSign } from "lucide-react";

interface PropertyCardProps {
  id: string;
  name: string;
  address: string;
  image: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  occupancyRate: number;
  onViewDetails?: () => void;
}

export function PropertyCard({
  id,
  name,
  address,
  image,
  totalUnits,
  occupiedUnits,
  monthlyRevenue,
  occupancyRate,
  onViewDetails,
}: PropertyCardProps) {
  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return "text-chart-2 bg-chart-2/10";
    if (rate >= 70) return "text-chart-3 bg-chart-3/10";
    return "text-chart-5 bg-chart-5/10";
  };

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-property-${id}`}>
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          data-testid={`img-property-${id}`}
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg" data-testid={`text-property-name-${id}`}>
            {name}
          </CardTitle>
          <Badge
            className={getOccupancyColor(occupancyRate)}
            data-testid={`badge-occupancy-${id}`}
          >
            {occupancyRate}% occupied
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span data-testid={`text-address-${id}`}>{address}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium" data-testid={`text-units-${id}`}>
                {occupiedUnits}/{totalUnits}
              </div>
              <div className="text-xs text-muted-foreground">Units</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium font-mono" data-testid={`text-revenue-${id}`}>
                ${monthlyRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Monthly</div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onViewDetails}
          data-testid={`button-view-property-${id}`}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
