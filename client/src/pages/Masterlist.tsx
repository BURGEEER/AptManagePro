import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  User,
  Users,
  Car,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Edit,
  MoreHorizontal,
  Home,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOwnerSchema, insertTenantSchema, type Owner, type Tenant, type Unit, type Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schemas
const ownerFormSchema = insertOwnerSchema.extend({});
const tenantFormSchema = insertTenantSchema.extend({});

type OwnerFormData = {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  type: "owner" | "tenant";
  isDeemed?: boolean | null;
  hasSublease?: boolean | null;
};

type TenantFormData = {
  name: string;
  email: string;
  phone?: string | null;
  unitId: string;
  leaseStartDate: Date;
  leaseEndDate?: Date | null;
  monthlyRent: string;
  depositAmount: string;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
};

export default function Masterlist() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOwnerDialogOpen, setIsAddOwnerDialogOpen] = useState(false);
  const [isAddTenantDialogOpen, setIsAddTenantDialogOpen] = useState(false);
  const { toast } = useToast();

  // Initialize forms
  const ownerForm = useForm<OwnerFormData>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      type: "owner",
      isDeemed: false,
      hasSublease: false,
    },
  });

  const tenantForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      unitId: "",
      leaseStartDate: new Date(),
      leaseEndDate: undefined,
      monthlyRent: "",
      depositAmount: "",
      emergencyContact: "",
      emergencyPhone: "",
    },
  });

  // Fetch data
  const { data: owners = [], isLoading: ownersLoading } = useQuery<Owner[]>({
    queryKey: ["/api/owners"],
  });

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Create owner mutation
  const createOwnerMutation = useMutation({
    mutationFn: async (data: OwnerFormData) => {
      const response = await apiRequest("POST", "/api/owners", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owners"] });
      toast({
        title: "Owner added",
        description: "The owner has been successfully added.",
      });
      setIsAddOwnerDialogOpen(false);
      ownerForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add owner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const response = await apiRequest("POST", "/api/tenants", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: "Tenant added",
        description: "The tenant has been successfully added.",
      });
      setIsAddTenantDialogOpen(false);
      tenantForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add tenant. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete owner mutation
  const deleteOwnerMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/owners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owners"] });
      toast({
        title: "Owner deleted",
        description: "The owner has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete owner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter data based on search
  const filteredOwners = owners.filter(owner =>
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unit details for display
  const getUnitDetails = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return "N/A";
    const property = properties.find(p => p.id === unit.propertyId);
    return `${unit.unitNumber} - ${property?.name || "Unknown"}`;
  };

  const onSubmitOwner = (data: OwnerFormData) => {
    console.log('Submitting owner form:', data);
    createOwnerMutation.mutate(data);
  };

  const onSubmitTenant = (data: TenantFormData) => {
    console.log('Submitting tenant form:', data);
    createTenantMutation.mutate(data);
  };

  const isLoading = ownersLoading || tenantsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Masterlist</h1>
          <p className="text-muted-foreground">
            Complete registry of owners and tenants
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or unit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-masterlist"
        />
      </div>

      <Tabs defaultValue="owners" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="owners" className="gap-2">
            <User className="h-4 w-4" />
            Owners ({filteredOwners.length})
          </TabsTrigger>
          <TabsTrigger value="tenants" className="gap-2">
            <Users className="h-4 w-4" />
            Tenants ({filteredTenants.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owners" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Property Owners</CardTitle>
                  <CardDescription>
                    Manage owner information and unit assignments
                  </CardDescription>
                </div>
                <Dialog open={isAddOwnerDialogOpen} onOpenChange={setIsAddOwnerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-owner">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Owner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Owner</DialogTitle>
                      <DialogDescription>
                        Enter the owner's information
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...ownerForm}>
                      <form onSubmit={ownerForm.handleSubmit(onSubmitOwner, (errors) => {
                        console.error('Owner form validation errors:', errors);
                      })} className="space-y-4">
                        <FormField
                          control={ownerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} data-testid="input-owner-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@example.com" {...field} data-testid="input-owner-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} value={field.value || ""} data-testid="input-owner-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St, City, State" {...field} value={field.value || ""} data-testid="input-owner-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-4">
                          <FormField
                            control={ownerForm.control}
                            name="isDeemed"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-owner-deemed"
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0 cursor-pointer">Deemed Owner</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={ownerForm.control}
                            name="hasSublease"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-owner-sublease"
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0 cursor-pointer">Has Sublease</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddOwnerDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createOwnerMutation.isPending}
                            data-testid="button-submit-owner"
                          >
                            {createOwnerMutation.isPending ? "Adding..." : "Add Owner"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredOwners.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {owners.length === 0 
                      ? "No owners registered yet"
                      : "No owners found matching your search"}
                  </p>
                  {owners.length === 0 && (
                    <Button onClick={() => setIsAddOwnerDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Owner
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOwners.map((owner) => (
                      <TableRow key={owner.id} data-testid={`row-owner-${owner.id}`}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{owner.name}</div>
                            <div className="text-sm text-muted-foreground">{owner.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {owner.phone || "No phone"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            {owner.type === "owner" ? "Owner" : "Tenant"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {owner.isDeemed && (
                              <Badge variant="secondary" className="text-xs">
                                Deemed
                              </Badge>
                            )}
                            {owner.hasSublease && (
                              <Badge variant="outline" className="text-xs">
                                Sublease
                              </Badge>
                            )}
                            {!owner.isDeemed && !owner.hasSublease && (
                              <Badge variant="default" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-owner-menu-${owner.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteOwnerMutation.mutate(owner.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Tenants</CardTitle>
                  <CardDescription>
                    Manage tenant information and lease details
                  </CardDescription>
                </div>
                <Dialog open={isAddTenantDialogOpen} onOpenChange={setIsAddTenantDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-tenant">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tenant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Tenant</DialogTitle>
                      <DialogDescription>
                        Enter the tenant's information and lease details
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...tenantForm}>
                      <form onSubmit={tenantForm.handleSubmit(onSubmitTenant, (errors) => {
                        console.error('Tenant form validation errors:', errors);
                      })} className="space-y-4">
                        <FormField
                          control={tenantForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Smith" {...field} data-testid="input-tenant-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={tenantForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jane@example.com" {...field} data-testid="input-tenant-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={tenantForm.control}
                          name="unitId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-tenant-unit">
                                    <SelectValue placeholder="Select a unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {units.filter(u => u.status === "available").map(unit => {
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
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={tenantForm.control}
                            name="monthlyRent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Rent</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="1500" {...field} data-testid="input-tenant-rent" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={tenantForm.control}
                            name="depositAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Deposit Amount</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="1500" {...field} data-testid="input-tenant-deposit" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddTenantDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createTenantMutation.isPending}
                            data-testid="button-submit-tenant"
                          >
                            {createTenantMutation.isPending ? "Adding..." : "Add Tenant"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredTenants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {tenants.length === 0 
                      ? "No tenants registered yet"
                      : "No tenants found matching your search"}
                  </p>
                  {tenants.length === 0 && (
                    <Button onClick={() => setIsAddTenantDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Tenant
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Lease Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.id}`}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{tenant.name}</div>
                            <div className="text-sm text-muted-foreground">{tenant.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.phone || "No phone"}
                        </TableCell>
                        <TableCell>
                          {getUnitDetails(tenant.unitId)}
                        </TableCell>
                        <TableCell>
                          ${tenant.monthlyRent}/mo
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(tenant.leaseStartDate).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              to {tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : "Ongoing"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-tenant-menu-${tenant.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                View Lease
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}