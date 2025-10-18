import { OccupancyChart } from "../OccupancyChart";

export default function OccupancyChartExample() {
  const data = [
    { month: "Jul", rate: 88 },
    { month: "Aug", rate: 91 },
    { month: "Sep", rate: 89 },
    { month: "Oct", rate: 92 },
    { month: "Nov", rate: 94 },
    { month: "Dec", rate: 93 },
  ];

  return (
    <div className="p-6">
      <OccupancyChart data={data} />
    </div>
  );
}
