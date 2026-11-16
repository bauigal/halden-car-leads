import { formatMileage } from "@/lib/format";
import type { LeadNotification } from "@/lib/notify/types";

export function renderLeadText(lead: LeadNotification): string {
  const engine =
    lead.vehicle.engineSizeCc === null ? "n/a" : `${lead.vehicle.engineSizeCc.toLocaleString("en-GB")} cc`;
  return [
    `Halden valuation ${lead.reference}`,
    `${lead.vehicle.make} ${lead.vehicle.model} (${lead.vehicle.year}), ${lead.vehicle.fuel}, ${engine}`,
    `Plate ${lead.vehicle.vrm}, ${formatMileage(lead.mileage)}`,
    `Condition ${lead.condition}; faults ${lead.faults.join(", ")}; keys ${lead.keys}`,
    `Photos recorded: ${lead.photos.length} (not stored)`,
    `Contact ${lead.contact.name}, ${lead.contact.phone}, ${lead.contact.email}`,
  ].join("\n");
}
