import type { LeadField } from "@/lib/validation";
import type { VehicleDetails } from "@/lib/vrm/types";

export type LeadResult =
  | { status: "idle" }
  | {
      status: "success";
      reference: string;
      vehicle: VehicleDetails;
      mileage: number;
      photoCount: number;
    }
  | {
      status: "error";
      code: string;
      fieldErrors?: Partial<Record<LeadField, string>>;
    };

export const idleLeadResult: LeadResult = { status: "idle" };
