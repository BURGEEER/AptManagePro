import { PropertyCard } from "../PropertyCard";
import modernBuilding from "@assets/generated_images/Modern_apartment_building_exterior_f859cd14.png";
import luxuryComplex from "@assets/generated_images/Luxury_apartment_complex_exterior_a666ca82.png";

export default function PropertyCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <PropertyCard
        id="1"
        name="Riverside Apartments"
        address="123 River St, Portland, OR"
        image={modernBuilding}
        totalUnits={48}
        occupiedUnits={45}
        monthlyRevenue={72000}
        occupancyRate={94}
        onViewDetails={() => console.log("View property 1")}
      />
      <PropertyCard
        id="2"
        name="Downtown Luxury Suites"
        address="456 Main Ave, Portland, OR"
        image={luxuryComplex}
        totalUnits={32}
        occupiedUnits={28}
        monthlyRevenue={98000}
        occupancyRate={88}
        onViewDetails={() => console.log("View property 2")}
      />
    </div>
  );
}
