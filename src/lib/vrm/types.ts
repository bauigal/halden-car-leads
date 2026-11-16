export type VehicleDetails = {
  vrm: string;
  make: string;
  model: string;
  year: number;
  fuel: string;
  engineSizeCc: number | null;
  colour?: string;
};

export type ProviderLookup =
  | { ok: true; found: true; vehicle: VehicleDetails }
  | { ok: true; found: false }
  | { ok: false; error: "provider_not_configured" | "provider_unavailable" };

export interface VrmProvider {
  readonly id: string;
  lookup(vrm: string): Promise<ProviderLookup>;
}

export type LookupBody =
  | { ok: true; found: true; vehicle: VehicleDetails }
  | { ok: true; found: false; code: "not_found" }
  | { ok: false; code: "vrm_required" | "vrm_invalid" | "invalid_json" | "provider_not_configured" | "provider_unavailable" };

export type LookupResponse = {
  httpStatus: number;
  body: LookupBody;
};
