import { TenantCard } from "../TenantCard";

export default function TenantCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <TenantCard
        id="1"
        name="Sarah Johnson"
        email="sarah.j@email.com"
        phone="(555) 123-4567"
        unit="204"
        property="Riverside Apartments"
        leaseEnd="Dec 2025"
        paymentStatus="paid"
        onViewDetails={() => console.log("View tenant 1")}
      />
      <TenantCard
        id="2"
        name="Michael Chen"
        email="m.chen@email.com"
        phone="(555) 987-6543"
        unit="105"
        property="Downtown Luxury Suites"
        leaseEnd="Mar 2026"
        paymentStatus="pending"
        onViewDetails={() => console.log("View tenant 2")}
      />
      <TenantCard
        id="3"
        name="Emma Williams"
        email="emma.w@email.com"
        phone="(555) 456-7890"
        unit="312"
        property="Riverside Apartments"
        leaseEnd="Jan 2025"
        paymentStatus="overdue"
        onViewDetails={() => console.log("View tenant 3")}
      />
    </div>
  );
}
