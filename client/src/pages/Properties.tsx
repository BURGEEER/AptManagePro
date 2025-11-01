import { useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Paperclip } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { type Property, type Document } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import modernBuilding from "@assets/generated_images/Modern_apartment_building_exterior_f859cd14.png";
import luxuryComplex from "@assets/generated_images/Luxury_apartment_complex_exterior_a666ca82.png";
import urbanBuilding from "@assets/generated_images/Urban_apartment_building_facade_39768cdb.png";
import suburbanCommunity from "@assets/generated_images/Suburban_apartment_community_exterior_4db7a630.png";

// Array of placeholder images to cycle through
const placeholderImages = [modernBuilding, luxuryComplex, urbanBuilding, suburbanCommunity];

// Form schema for property creation - use the actual schema from shared
const propertyFormSchema = insertPropertySchema.extend({});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

export default function Properties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      totalUnits: 0,
      yearBuilt: undefined,
      imageUrl: undefined,
      amenities: [],
    },
  });

  // Fetch properties
  const { data: properties = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Fetch units to calculate occupancy
  const { data: units = [] } = useQuery<any[]>({
    queryKey: ["/api/units"],
  });

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const response = await apiRequest("POST", "/api/properties", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Property added",
        description: "The property has been successfully added.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add property. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Property deleted",
        description: "The property has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate statistics for each property
  const propertiesWithStats = properties.map((property, index) => {
    const propertyUnits = units.filter((u: any) => u.propertyId === property.id);
    const occupiedUnits = propertyUnits.filter((u: any) => u.status === "occupied").length;
    const occupancyRate = propertyUnits.length > 0 
      ? Math.round((occupiedUnits / propertyUnits.length) * 100)
      : 0;
    
    // Calculate monthly revenue (mock calculation)
    const monthlyRevenue = occupiedUnits * 1500; // Average rent per unit

    return {
      ...property,
      image: placeholderImages[index % placeholderImages.length],
      totalUnits: property.totalUnits,
      occupiedUnits,
      monthlyRevenue,
      occupancyRate,
    };
  });

  // Filter properties based on search
  const filteredProperties = propertiesWithStats.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (data: PropertyFormData) => {
    console.log('Submitting property form:', data);
    createPropertyMutation.mutate(data);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load properties</p>
        <Button 
          variant="ghost" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/properties"] })}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Properties
          </h1>
          <p className="text-muted-foreground">
            Manage your property portfolio
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-property">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Enter the details of your new property.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.error('Form validation errors:', errors);
              })} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Riverside Apartments" 
                          {...field}
                          data-testid="input-property-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 123 Main Street" 
                          {...field}
                          data-testid="input-property-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Portland" 
                            {...field}
                            data-testid="input-property-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. OR" 
                            {...field}
                            data-testid="input-property-state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 97201" 
                          {...field}
                          data-testid="input-property-zipcode"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Units</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 24" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-total-units"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Document Upload Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Documents (Optional)</label>
                  <p className="text-xs text-muted-foreground">
                    Upload contracts, permits, or other property-related documents
                  </p>
                  <FileUpload
                    entityType="property"
                    entityId={`temp_property_${Date.now()}`} // Temporary ID until property is created
                    category="contract"
                    isPrivate={true}
                    onUploadSuccess={() => {
                      toast({
                        title: "Document uploaded",
                        description: "Document has been attached to this property",
                      });
                    }}
                    maxFiles={10}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPropertyMutation.isPending}
                    data-testid="button-submit-property"
                  >
                    {createPropertyMutation.isPending ? "Adding..." : "Add Property"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search properties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-properties"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg">
          <p className="text-muted-foreground mb-4">
            {properties.length === 0 
              ? "No properties yet. Add your first property to get started."
              : "No properties found matching your search."}
          </p>
          {properties.length === 0 && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              data-testid="button-add-first-property"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
              onViewDetails={() => {
                // Navigate to property details
                window.location.href = `/properties/${property.id}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}