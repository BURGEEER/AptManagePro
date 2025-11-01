import { useState } from "react";
import { MaintenanceRequestCard } from "@/components/MaintenanceRequestCard";
import { UtilityReadingCard } from "@/components/UtilityReadingCard";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Plus, 
  Search, 
  Wrench, 
  Droplets, 
  Zap,
  Paintbrush,
  PipetteIcon,
  AlertCircle,
  Home,
  Wifi,
  FileText,
  Download,
  Clock,
  Paperclip
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMaintenanceRequestSchema, type MaintenanceRequest, type Property, type Unit, type Document } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

// Form schema
const maintenanceFormSchema = insertMaintenanceRequestSchema.extend({});

type MaintenanceFormData = {
  unitId: string;
  title: string;
  description: string;
  category: "plumbing" | "electrical" | "civil" | "carpentry" | "hvac" | "appliances" | "painting" | "cleaning" | "other";
  priority: "low" | "medium" | "high" | "emergency";
  status: "submitted" | "in-progress" | "resolved" | "closed";
  reportedBy: string;
  assignedTo?: string | null;
  scheduledDate?: Date | null;
  completedDate?: Date | null;
  attachments?: string[] | null;
  notes?: string | null;
};

export default function Maintenance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddRequestOpen, setIsAddRequestOpen] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      unitId: "",
      title: "",
      description: "",
      category: "plumbing",
      priority: "medium",
      status: "submitted",
      reportedBy: "",
      assignedTo: "",
      scheduledDate: undefined,
      completedDate: undefined,
      attachments: [],
      notes: "",
    },
  });

  // Fetch data
  const { data: maintenanceRequests = [], isLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance-requests"],
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Create maintenance request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const response = await apiRequest("POST", "/api/maintenance-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-requests"] });
      toast({
        title: "Request created",
        description: "Maintenance request has been successfully created.",
      });
      setIsAddRequestOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create maintenance request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/maintenance-requests/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-requests"] });
      toast({
        title: "Status updated",
        description: "Maintenance request status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter requests
  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || request.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unit details for display
  const getUnitDetails = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return { unit: "N/A", property: "Unknown" };
    const property = properties.find(p => p.id === unit.propertyId);
    return {
      unit: unit.unitNumber,
      property: property?.name || "Unknown"
    };
  };

  // Category icons
  const categoryIcons: { [key: string]: JSX.Element } = {
    civil: <Paintbrush className="h-4 w-4" />,
    plumbing: <PipetteIcon className="h-4 w-4" />,
    electrical: <Zap className="h-4 w-4" />,
    carpentry: <Home className="h-4 w-4" />,
    hvac: <Droplets className="h-4 w-4" />,
    appliances: <Wifi className="h-4 w-4" />,
    other: <Wrench className="h-4 w-4" />,
  };

  // Count by category
  const requestsByCategory = maintenanceRequests.reduce((acc, request) => {
    acc[request.category] = (acc[request.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const onSubmit = (data: MaintenanceFormData) => {
    console.log('Submitting maintenance request:', data);
    createRequestMutation.mutate(data);
  };

  const utilityReadings = [
    {
      id: "1",
      unit: "204",
      property: "Riverside Apartments",
      waterReading: 145,
      electricReading: 890,
      previousWater: 132,
      previousElectric: 820,
      readingDate: "Dec 20, 2024",
      status: "normal" as const,
    },
    {
      id: "2",
      unit: "105",
      property: "Downtown Luxury Suites",
      waterReading: 198,
      electricReading: 1250,
      previousWater: 165,
      previousElectric: 1100,
      readingDate: "Dec 20, 2024",
      status: "high" as const,
    },
    {
      id: "3",
      unit: "312",
      property: "Riverside Apartments",
      waterReading: 220,
      electricReading: 980,
      previousWater: 178,
      previousElectric: 850,
      readingDate: "Dec 20, 2024",
      status: "warning" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Maintenance & Utilities
          </h1>
          <p className="text-muted-foreground">
            Track maintenance requests and utility consumption
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-concern-template">
            <FileText className="h-4 w-4 mr-2" />
            Concern Template
          </Button>
          <Dialog open={isAddRequestOpen} onOpenChange={setIsAddRequestOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-request">
                <Plus className="h-4 w-4 mr-2" />
                File Unit Concern
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>File Maintenance Request</DialogTitle>
                <DialogDescription>
                  Submit a new maintenance request for a unit
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  console.error('Maintenance form validation errors:', errors);
                })} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="unitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-request-unit">
                              <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units.map(unit => {
                              const property = properties.find(p => p.id === unit.propertyId);
                              return (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.unitNumber} - {property?.name || "Unknown"}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the issue" {...field} data-testid="input-request-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide detailed description of the issue..." 
                            {...field} 
                            rows={4}
                            data-testid="input-request-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-request-category">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="civil">Civil</SelectItem>
                              <SelectItem value="carpentry">Carpentry</SelectItem>
                              <SelectItem value="hvac">HVAC</SelectItem>
                              <SelectItem value="appliances">Appliances</SelectItem>
                              <SelectItem value="painting">Painting</SelectItem>
                              <SelectItem value="cleaning">Cleaning</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-request-priority">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="reportedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reported By</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person reporting" {...field} data-testid="input-request-reporter" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Document Upload Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attach Documents (Optional)</label>
                    <p className="text-xs text-muted-foreground">
                      Upload photos, invoices, or any relevant documents for this maintenance request
                    </p>
                    <FileUpload
                      entityType="maintenance_request"
                      entityId={`temp_${Date.now()}`} // Temporary ID until request is created
                      category="maintenance"
                      isPrivate={true}
                      onUploadSuccess={() => {
                        toast({
                          title: "Document uploaded",
                          description: "Document has been attached to this request",
                        });
                      }}
                      maxFiles={5}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddRequestOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createRequestMutation.isPending}
                      data-testid="button-submit-request"
                    >
                      {createRequestMutation.isPending ? "Creating..." : "Create Request"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(requestsByCategory).map(([category, count]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                <div className="flex items-center gap-2">
                  {categoryIcons[category] || <Wrench className="h-4 w-4" />}
                  <span>{category}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{count}</div>
              <p className="text-xs text-muted-foreground">active</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" data-testid="tab-requests">
            <Wrench className="h-4 w-4 mr-2" />
            Maintenance Requests
            <Badge variant="secondary" className="ml-2">
              {filteredRequests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="utilities" data-testid="tab-utilities">
            <Droplets className="h-4 w-4 mr-2" />
            Utility Readings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Notification Banner */}
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-base">New Unit Concerns</CardTitle>
                  <Badge variant="destructive">
                    {maintenanceRequests.filter(r => r.status === "submitted").length} new
                  </Badge>
                </div>
                <Button size="sm" variant="outline">View All</Button>
              </div>
            </CardHeader>
          </Card>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-requests"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40" data-testid="select-filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="appliances">Appliances</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {maintenanceRequests.length === 0 
                      ? "No maintenance requests yet"
                      : "No requests found matching your filters"}
                  </p>
                  {maintenanceRequests.length === 0 && (
                    <Button onClick={() => setIsAddRequestOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Request
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request) => {
                const unitDetails = getUnitDetails(request.unitId);
                return (
                  <MaintenanceRequestCard
                    key={request.id}
                    id={request.id}
                    title={request.title}
                    description={request.description}
                    property={unitDetails.property}
                    unit={unitDetails.unit}
                    tenant={request.tenantId || "Admin"}
                    status={request.status as "submitted" | "in-progress" | "resolved"}
                    priority={request.priority as "low" | "medium" | "high"}
                    category={request.category}
                    createdAt={new Date(request.createdAt).toLocaleString()}
                    onViewDetails={() => console.log(`View request ${request.id}`)}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="utilities" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Water & Electric Consumption</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" data-testid="button-record-reading">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Reading
                </Button>
                <Button size="sm" variant="outline" data-testid="button-export-readings">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monthly utility consumption tracking and analysis
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {utilityReadings.map((reading) => (
              <UtilityReadingCard key={reading.id} {...reading} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}