import { copy } from "@/content/copy";
import { formatEngine, formatMileage } from "@/lib/format";
import type { VehicleDetails } from "@/lib/vrm/types";

export function VehicleFacts({ vehicle, mileage }: { vehicle: VehicleDetails; mileage: number }) {
  const rows: { term: string; value: string }[] = [
    { term: copy.flow.facts.registration, value: vehicle.vrm },
    { term: copy.flow.facts.vehicle, value: `${vehicle.make} ${vehicle.model}` },
    { term: copy.flow.facts.year, value: String(vehicle.year) },
    { term: copy.flow.facts.fuel, value: vehicle.fuel },
  ];
  if (vehicle.engineSizeCc !== null) {
    rows.push({ term: copy.flow.facts.engine, value: formatEngine(vehicle.engineSizeCc) });
  }
  if (vehicle.colour) {
    rows.push({ term: copy.flow.facts.colour, value: vehicle.colour });
  }
  rows.push({ term: copy.flow.facts.mileage, value: formatMileage(mileage) });

  return (
    <dl className="grid gap-0">
      {rows.map((row) => (
        <div key={row.term} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
          <dt className="text-sm text-muted-foreground">{row.term}</dt>
          <dd className="text-right text-sm font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
