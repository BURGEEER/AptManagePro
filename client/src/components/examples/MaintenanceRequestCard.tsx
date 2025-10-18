import { MaintenanceRequestCard } from "../MaintenanceRequestCard";

export default function MaintenanceRequestCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <MaintenanceRequestCard
        id="1"
        title="Leaking Faucet"
        description="Kitchen faucet has been dripping constantly for the past two days. Need urgent repair."
        property="Riverside Apartments"
        unit="204"
        tenant="Sarah Johnson"
        status="in-progress"
        priority="high"
        createdAt="2 hours ago"
        onViewDetails={() => console.log("View request 1")}
      />
      <MaintenanceRequestCard
        id="2"
        title="AC Not Working"
        description="Air conditioning unit stopped working. Room temperature is uncomfortable."
        property="Downtown Luxury Suites"
        unit="105"
        tenant="Michael Chen"
        status="submitted"
        priority="medium"
        createdAt="5 hours ago"
        onViewDetails={() => console.log("View request 2")}
      />
      <MaintenanceRequestCard
        id="3"
        title="Light Bulb Replacement"
        description="Hallway light bulb needs replacement."
        property="Riverside Apartments"
        unit="312"
        tenant="Emma Williams"
        status="resolved"
        priority="low"
        createdAt="1 day ago"
        onViewDetails={() => console.log("View request 3")}
      />
    </div>
  );
}
