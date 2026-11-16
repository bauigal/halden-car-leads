import type { Condition, Fault, Keys } from "@/lib/validation";
import type { PhotoMeta } from "@/lib/photos";
import type { VehicleDetails } from "@/lib/vrm/types";

export type LeadNotification = {
  reference: string;
  submittedAt: string;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  vehicle: VehicleDetails;
  mileage: number;
  condition: Condition;
  faults: Fault[];
  keys: Keys;
  photos: PhotoMeta[];
  photoStorage: "noop";
};

export interface LeadNotifier {
  readonly id: string;
  notify(lead: LeadNotification): Promise<void>;
}

export class NotifierConfigError extends Error {
  constructor(readonly channel: string) {
    super(`${channel} notifier is enabled but its environment variables are missing.`);
    this.name = "NotifierConfigError";
  }
}
