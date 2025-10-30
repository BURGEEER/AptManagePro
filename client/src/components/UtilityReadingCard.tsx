import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Zap, TrendingUp } from "lucide-react";

interface UtilityReadingCardProps {
  id: string;
  unit: string;
  property: string;
  waterReading: number;
  electricReading: number;
  previousWater: number;
  previousElectric: number;
  readingDate: string;
  status: "normal" | "high" | "warning";
}

export function UtilityReadingCard({
  id,
  unit,
  property,
  waterReading,
  electricReading,
  previousWater,
  previousElectric,
  readingDate,
  status,
}: UtilityReadingCardProps) {
  const waterChange = ((waterReading - previousWater) / previousWater) * 100;
  const electricChange = ((electricReading - previousElectric) / previousElectric) * 100;

  const getStatusColor = () => {
    switch (status) {
      case "normal":
        return "text-chart-2 bg-chart-2/10";
      case "high":
        return "text-chart-3 bg-chart-3/10";
      case "warning":
        return "text-chart-5 bg-chart-5/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className="hover-elevate" data-testid={`card-utility-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Unit {unit}</CardTitle>
            <p className="text-sm text-muted-foreground">{property}</p>
          </div>
          <Badge className={getStatusColor()} data-testid={`badge-status-${id}`}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-4 w-4" />
              <span className="text-sm">Water</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-semibold font-mono">
                {waterReading.toLocaleString()} m³
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className={`h-3 w-3 ${waterChange > 10 ? 'text-chart-5' : 'text-chart-2'}`} />
                <span className={waterChange > 10 ? 'text-chart-5' : 'text-chart-2'}>
                  {waterChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Electric</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-semibold font-mono">
                {electricReading.toLocaleString()} kWh
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className={`h-3 w-3 ${electricChange > 10 ? 'text-chart-5' : 'text-chart-2'}`} />
                <span className={electricChange > 10 ? 'text-chart-5' : 'text-chart-2'}>
                  {electricChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">Last reading: {readingDate}</span>
          <Button size="sm" variant="ghost" data-testid={`button-view-history-${id}`}>
            View History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}