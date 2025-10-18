import { useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import modernBuilding from "@assets/generated_images/Modern_apartment_building_exterior_f859cd14.png";
import luxuryComplex from "@assets/generated_images/Luxury_apartment_complex_exterior_a666ca82.png";
import urbanBuilding from "@assets/generated_images/Urban_apartment_building_facade_39768cdb.png";
import suburbanCommunity from "@assets/generated_images/Suburban_apartment_community_exterior_4db7a630.png";

export default function Properties() {
  const [searchQuery, setSearchQuery] = useState("");

  const properties = [
    {
      id: "1",
      name: "Riverside Apartments",
      address: "123 River St, Portland, OR",
      image: modernBuilding,
      totalUnits: 48,
      occupiedUnits: 45,
      monthlyRevenue: 72000,
      occupancyRate: 94,
    },
    {
      id: "2",
      name: "Downtown Luxury Suites",
      address: "456 Main Ave, Portland, OR",
      image: luxuryComplex,
      totalUnits: 32,
      occupiedUnits: 28,
      monthlyRevenue: 98000,
      occupancyRate: 88,
    },
    {
      id: "3",
      name: "Urban Heights",
      address: "789 Park Blvd, Portland, OR",
      image: urbanBuilding,
      totalUnits: 64,
      occupiedUnits: 58,
      monthlyRevenue: 114500,
      occupancyRate: 91,
    },
    {
      id: "4",
      name: "Meadow View Commons",
      address: "321 Oak Lane, Beaverton, OR",
      image: suburbanCommunity,
      totalUnits: 56,
      occupiedUnits: 52,
      monthlyRevenue: 89000,
      occupancyRate: 93,
    },
  ];

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
        <Button data-testid="button-add-property">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            {...property}
            onViewDetails={() => console.log(`View property ${property.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
