import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Check, AlertCircle, Info, Wrench, DollarSign, Megaphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Query for unread count
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Query for recent notifications
  const { data: recentNotifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/recent"],
    enabled: isOpen,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}/read`, "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("/api/notifications/mark-all-read", "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  // Check for high-priority notifications and show toast
  useEffect(() => {
    if (recentNotifications && recentNotifications.length > 0) {
      const urgentNotifications = recentNotifications.filter(
        (n) => n.priority === "urgent" && n.status === "unread"
      );
      
      if (urgentNotifications.length > 0) {
        const latest = urgentNotifications[0];
        toast({
          title: latest.title,
          description: latest.message,
          variant: "destructive",
        });
      }
    }
  }, [recentNotifications, toast]);

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

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === "unread") {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative" 
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount && unreadCount.count > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              data-testid="badge-unread-count"
            >
              {unreadCount.count > 9 ? "9+" : unreadCount.count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {recentNotifications && recentNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="h-auto p-1 text-xs"
              data-testid="button-mark-all-read"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : !recentNotifications || recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No notifications
            </div>
          ) : (
            <>
              {recentNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${
                    notification.status === "unread" ? "bg-muted/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <Link href={notification.actionUrl || "/"} className="w-full">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          {notification.status === "unread" && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getPriorityColor(notification.priority)}
                            className="text-xs px-1 py-0"
                          >
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { 
                              addSuffix: true 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </ScrollArea>
        {recentNotifications && recentNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center" 
                  size="sm"
                  data-testid="button-view-all-notifications"
                >
                  View all notifications
                </Button>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}