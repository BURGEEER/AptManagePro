import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Zap, Wrench, AlertCircle } from "lucide-react";

interface AnnouncementCardProps {
  id: string;
  title: string;
  description: string;
  category: "maintenance" | "power" | "repair" | "general";
  date: string;
  priority: "urgent" | "normal";
}

export function AnnouncementCard({
  id,
  title,
  description,
  category,
  date,
  priority,
}: AnnouncementCardProps) {
  const getCategoryIcon = () => {
    switch (category) {
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "power":
        return <Zap className="h-4 w-4" />;
      case "repair":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case "maintenance":
        return "text-chart-1 bg-chart-1/10";
      case "power":
        return "text-chart-3 bg-chart-3/10";
      case "repair":
        return "text-chart-5 bg-chart-5/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className="hover-elevate" data-testid={`card-announcement-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-md ${getCategoryColor()}`}>
              {getCategoryIcon()}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold" data-testid={`text-announcement-title-${id}`}>
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">{date}</p>
            </div>
          </div>
          {priority === "urgent" && (
            <Badge variant="destructive" data-testid={`badge-priority-${id}`}>
              Urgent
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground" data-testid={`text-description-${id}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}