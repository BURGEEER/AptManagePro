import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  AlertCircle,
  Info,
  Wrench,
  DollarSign,
  Megaphone,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from "date-fns";
import type { Notification } from "@shared/schema";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Query for notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}/read`, "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("/api/notifications/mark-all-read", "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "payment":
        return <DollarSign className="h-4 w-4" />;
      case "announcement":
        return <Megaphone className="h-4 w-4" />;
      case "system":
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
      default:
        return "outline";
    }
  };

  // Filter notifications
  const filteredNotifications = notifications?.filter((notification) => {
    if (typeFilter !== "all" && notification.type !== typeFilter) return false;
    if (priorityFilter !== "all" && notification.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && notification.status !== statusFilter) return false;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications?.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    let groupKey = "Older";

    if (isToday(date)) {
      groupKey = "Today";
    } else if (isYesterday(date)) {
      groupKey = "Yesterday";
    } else if (isThisWeek(date)) {
      groupKey = "This Week";
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const groupOrder = ["Today", "Yesterday", "This Week", "Older"];

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === "unread") {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const unreadCount = filteredNotifications?.filter((n) => n.status === "unread").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with important events and announcements
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All notifications are read"}
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32" data-testid="select-priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[600px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading notifications...</p>
                </div>
              </div>
            ) : !groupedNotifications || Object.keys(groupedNotifications).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your filters"
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupOrder
                  .filter((group) => groupedNotifications[group])
                  .map((groupName) => (
                    <div key={groupName}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        {groupName} ({groupedNotifications[groupName]?.length || 0})
                      </h3>
                      <div className="space-y-2">
                        {groupedNotifications[groupName]?.map((notification) => (
                          <Card
                            key={notification.id}
                            className={`p-4 cursor-pointer transition-colors ${
                              notification.status === "unread"
                                ? "bg-muted/50 border-primary/30"
                                : "hover:bg-muted/30"
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                            data-testid={`notification-card-${notification.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{notification.title}</h4>
                                    {notification.status === "unread" && (
                                      <div className="h-2 w-2 rounded-full bg-primary" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Badge
                                      variant={getPriorityColor(notification.priority)}
                                      className="text-xs"
                                    >
                                      {notification.priority}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {notification.type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDistanceToNow(new Date(notification.createdAt), {
                                        addSuffix: true,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {notification.status === "read" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsReadMutation.mutate(notification.id);
                                    }}
                                    data-testid={`button-mark-read-${notification.id}`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotificationMutation.mutate(notification.id);
                                  }}
                                  data-testid={`button-delete-${notification.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}