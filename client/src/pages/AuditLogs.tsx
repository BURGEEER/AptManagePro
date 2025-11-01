import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Download, Search, RefreshCw, Eye, Filter, Activity, Shield, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { AuditLog } from "@shared/schema";

interface EnrichedAuditLog extends AuditLog {
  userName: string;
}

export default function AuditLogs() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedLog, setSelectedLog] = useState<EnrichedAuditLog | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (selectedAction !== "all") queryParams.set("action", selectedAction);
  if (selectedEntityType !== "all") queryParams.set("entityType", selectedEntityType);
  if (selectedUser !== "all") queryParams.set("userId", selectedUser);
  if (dateRange.from) queryParams.set("startDate", dateRange.from.toISOString());
  if (dateRange.to) queryParams.set("endDate", dateRange.to.toISOString());
  if (searchQuery) queryParams.set("entityId", searchQuery);

  // Fetch audit logs
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/audit-logs", queryParams.toString()],
  });

  // Fetch audit stats
  const { data: stats } = useQuery({
    queryKey: ["/api/audit-logs/stats", dateRange],
  });

  // Fetch users for filter dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/audit-logs/export?${queryParams.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Audit logs have been exported to CSV",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export audit logs",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE": return "default";
      case "UPDATE": return "secondary";
      case "DELETE": return "destructive";
      case "LOGIN": return "outline";
      case "LOGOUT": return "outline";
      case "LOGIN_FAILED": return "destructive";
      case "EXPORT": return "secondary";
      default: return "default";
    }
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case "user": return "👤";
      case "property": return "🏢";
      case "tenant": return "🏠";
      case "maintenance_request": return "🔧";
      case "transaction": return "💰";
      case "announcement": return "📢";
      default: return "📄";
    }
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return "Unknown";
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    return match ? match[0] : userAgent.split(" ")[0];
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">Track all system activities and changes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || isLoading}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Activity className="h-3 w-3 mr-1" />
                All time
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Active User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {stats.actionsByUser[0]?.userName || "N/A"}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.actionsByUser[0]?.count || 0} actions
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Login Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {stats.actionsByType["LOGIN"] || 0} logins
              </div>
              <div className="text-xs text-destructive">
                {stats.actionsByType["LOGIN_FAILED"] || 0} failed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-destructive">
                {stats.actionsByType["DELETE"] || 0} deletions
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Requires attention
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entity ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger data-testid="select-action">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="LOGIN_FAILED">Failed Login</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger data-testid="select-entity-type">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="maintenance_request">Maintenance Request</SelectItem>
                <SelectItem value="transaction">Transaction</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger data-testid="select-user">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName || user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range || {})}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            All system activities are logged for security and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: EnrichedAuditLog) => (
                    <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.userName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getEntityTypeIcon(log.entityType)}</span>
                          <div>
                            <div className="font-medium">{log.entityType}</div>
                            {log.entityId && (
                              <div className="text-xs text-muted-foreground">
                                ID: {log.entityId.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatUserAgent(log.userAgent || "")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          data-testid={`button-view-${log.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="h-full max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date/Time</p>
                    <p className="font-mono">
                      {format(new Date(selectedLog.createdAt), "PPpp")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User</p>
                    <p>{selectedLog.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Action</p>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entity</p>
                    <p>
                      {selectedLog.entityType}
                      {selectedLog.entityId && ` (${selectedLog.entityId})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p className="font-mono">{selectedLog.ipAddress || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                    <p className="text-xs">{selectedLog.userAgent || "Unknown"}</p>
                  </div>
                </div>

                {selectedLog.oldValues && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Previous Values
                    </p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.oldValues, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.newValues && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      New Values
                    </p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Additional Metadata
                    </p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}