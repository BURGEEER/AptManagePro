import { RevenueChart } from "../RevenueChart";

export default function RevenueChartExample() {
  const data = [
    { month: "Jul", revenue: 245000 },
    { month: "Aug", revenue: 268000 },
    { month: "Sep", revenue: 255000 },
    { month: "Oct", revenue: 278000 },
    { month: "Nov", revenue: 292000 },
    { month: "Dec", revenue: 284500 },
  ];

  return (
    <div className="p-6">
      <RevenueChart data={data} />
    </div>
  );
}
