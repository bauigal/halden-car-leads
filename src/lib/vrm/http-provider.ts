import type { AppEnv } from "@/lib/env";
import { formatVrm, normaliseVrm } from "@/lib/plates";
import type { ProviderLookup, VehicleDetails, VrmProvider } from "@/lib/vrm/types";

/**
 * Adapter stub for a commercial UK VRM API.
 *
 * Enable it with:
 *   VRM_PROVIDER=http
 *   VRM_API_BASE_URL=https://your-provider.example/lookup
 *   VRM_API_KEY=...            # set in the host, never in git
 *
 * Request: POST {VRM_API_BASE_URL}
 *   Authorization: Bearer {VRM_API_KEY}
 *   {"registrationNumber":"OV19HRL"}
 *
 * Success body this mapper understands:
 *   {
 *     "make": "Volvo",
 *     "model": "XC40",
 *     "yearOfManufacture": 2019,
 *     "fuelType": "Petrol",
 *     "engineCapacityCc": 1969,
 *     "colour": "Blue"
 *   }
 *
 * Not found: HTTP 404, or {"found": false}, or {"error": "not_found"}.
 *
 * The official DVLA Vehicle Enquiry API does not return the model, so it
 * cannot fill this form on its own. Point the URL at a provider that does,
 * and change `mapHttpVehicle` if their JSON uses different field names.
 * No key is shipped with this demo. Without both env vars, lookup returns
 * provider_not_configured and does not call the network.
 */

type FetchLike = typeof fetch;

export function mapHttpVehicle(payload: unknown, vrm: string): VehicleDetails | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const make = readString(record.make);
  const model = readString(record.model);
  const year = readYear(record.yearOfManufacture);
  const fuel = titleCase(readString(record.fuelType));
  if (!make || !model || year === null || !fuel) return null;

  const engine = readEngine(record.engineCapacityCc);
  const colour = readString(record.colour);

  return {
    vrm: formatVrm(vrm),
    make,
    model,
    year,
    fuel,
    engineSizeCc: engine,
    ...(colour ? { colour } : {}),
  };
}

export function isNotFoundPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  return record.found === false || record.error === "not_found";
}

export class HttpVrmProvider implements VrmProvider {
  readonly id = "http";

  constructor(
    private readonly env: AppEnv,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async lookup(vrm: string): Promise<ProviderLookup> {
    const baseUrl = this.env.VRM_API_BASE_URL?.trim();
    const apiKey = this.env.VRM_API_KEY?.trim();
    if (!baseUrl || !apiKey) return { ok: false, error: "provider_not_configured" };

    const registrationNumber = normaliseVrm(vrm);
    let response: Response;
    try {
      response = await this.fetchImpl(baseUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      console.error("[halden] VRM provider request failed");
      return { ok: false, error: "provider_unavailable" };
    }

    if (response.status === 404) return { ok: true, found: false };
    if (!response.ok) {
      console.error(`[halden] VRM provider responded ${response.status}`);
      return { ok: false, error: "provider_unavailable" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      console.error("[halden] VRM provider returned invalid JSON");
      return { ok: false, error: "provider_unavailable" };
    }

    if (isNotFoundPayload(payload)) return { ok: true, found: false };
    const vehicle = mapHttpVehicle(payload, registrationNumber);
    if (!vehicle) {
      console.error("[halden] VRM provider JSON did not match the expected shape");
      return { ok: false, error: "provider_unavailable" };
    }
    return { ok: true, found: true, vehicle };
  }
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readYear(value: unknown): number | null {
  const year = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return null;
  return year;
}

function readEngine(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const size = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(size) || size < 0 || size > 20000) return null;
  return size;
}

function titleCase(value: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
