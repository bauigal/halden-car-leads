import { describe, expect, it, vi } from "vitest";

import { copy } from "@/content/copy";
import { isValidVrm, normaliseVrm } from "@/lib/plates";
import { HttpVrmProvider, mapHttpVehicle } from "@/lib/vrm/http-provider";
import { lookupVehicle } from "@/lib/vrm/lookup";
import { getVrmProvider } from "@/lib/vrm/get-provider";
import { DEMO_VEHICLES, MockVrmProvider } from "@/lib/vrm/mock-provider";

const NOW = new Date("2026-11-16T12:00:00.000Z");

describe("mock vehicle lookup", () => {
  it("returns the same fictional car every time", async () => {
    const provider = new MockVrmProvider();
    const first = await provider.lookup("ov19 hrl");
    const second = await provider.lookup("OV19HRL");
    expect(first).toEqual(second);
    expect(first.ok && first.found && first.vehicle.make).toBe("Volvo");
    expect(first.ok && first.found && first.vehicle.model).toBe("XC40");
  });

  it("reports a valid plate that is not in the demo stock", async () => {
    const result = await lookupVehicle("XX22 AAA", new MockVrmProvider());
    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: true, found: false, code: "not_found" });
  });

  it("rejects a plate before asking the provider", async () => {
    const lookup = vi.fn();
    const result = await lookupVehicle("HELLO", { id: "fake", lookup });
    expect(lookup).not.toHaveBeenCalled();
    expect(result).toEqual({ httpStatus: 400, body: { ok: false, code: "vrm_invalid" } });
    const missing = await lookupVehicle("   ", { id: "fake", lookup });
    expect(missing.body).toEqual({ ok: false, code: "vrm_required" });
  });

  it("finds every advertised demo car", async () => {
    for (const plate of copy.demoPlates) {
      expect(isValidVrm(plate.vrm, NOW)).toBe(true);
      const response = await lookupVehicle(plate.vrm, new MockVrmProvider());
      if (plate.found) {
        expect(response.httpStatus).toBe(200);
        if (response.body.ok && response.body.found) {
          expect(plate.caption).toBe(`${response.body.vehicle.year} ${response.body.vehicle.make} ${response.body.vehicle.model}`);
        }
      } else {
        expect(response.body).toMatchObject({ found: false });
      }
    }

    for (const vehicle of DEMO_VEHICLES) {
      const found = await new MockVrmProvider().lookup(normaliseVrm(vehicle.vrm));
      expect(found).toMatchObject({ ok: true, found: true, vehicle });
    }
  });
});

describe("HTTP provider adapter", () => {
  it("does not call the network without a URL and key", async () => {
    const fetchImpl = vi.fn();
    const provider = new HttpVrmProvider({}, fetchImpl);
    await expect(provider.lookup("OV19 HRL")).resolves.toEqual({ ok: false, error: "provider_not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts the normalised plate and maps the documented JSON", async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({
        make: "Volvo",
        model: "XC40",
        yearOfManufacture: "2019",
        fuelType: "PETROL",
        engineCapacityCc: 1969,
        colour: "Blue",
      }),
    );
    const provider = new HttpVrmProvider(
      { VRM_API_BASE_URL: "https://vehicles.example/lookup", VRM_API_KEY: "test-key" },
      fetchImpl,
    );
    const result = await provider.lookup("ov19 hrl");
    expect(result).toMatchObject({
      ok: true,
      found: true,
      vehicle: { vrm: "OV19 HRL", make: "Volvo", model: "XC40", year: 2019, fuel: "Petrol", engineSizeCc: 1969, colour: "Blue" },
    });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://vehicles.example/lookup");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(init?.body).toBe(JSON.stringify({ registrationNumber: "OV19HRL" }));
  });

  it("treats a 404 and an explicit not-found body as a miss", async () => {
    const missing = new HttpVrmProvider(
      { VRM_API_BASE_URL: "https://vehicles.example/lookup", VRM_API_KEY: "test-key" },
      vi.fn(async () => new Response(null, { status: 404 })),
    );
    await expect(missing.lookup("XX22 AAA")).resolves.toEqual({ ok: true, found: false });

    const flagged = new HttpVrmProvider(
      { VRM_API_BASE_URL: "https://vehicles.example/lookup", VRM_API_KEY: "test-key" },
      vi.fn(async () => Response.json({ error: "not_found" })),
    );
    await expect(flagged.lookup("XX22 AAA")).resolves.toEqual({ ok: true, found: false });
  });

  it("fails closed when the provider is down or the JSON is unfamiliar", async () => {
    const down = new HttpVrmProvider(
      { VRM_API_BASE_URL: "https://vehicles.example/lookup", VRM_API_KEY: "test-key" },
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    await expect(down.lookup("OV19 HRL")).resolves.toEqual({ ok: false, error: "provider_unavailable" });

    expect(mapHttpVehicle({ make: "Volvo" }, "OV19HRL")).toBeNull();
    const odd = new HttpVrmProvider(
      { VRM_API_BASE_URL: "https://vehicles.example/lookup", VRM_API_KEY: "test-key" },
      vi.fn(async () => Response.json({ make: "Volvo" })),
    );
    await expect(odd.lookup("OV19 HRL")).resolves.toEqual({ ok: false, error: "provider_unavailable" });
  });

  it("selects the provider from the environment", () => {
    expect(getVrmProvider({}).id).toBe("mock");
    expect(getVrmProvider({ VRM_PROVIDER: "http" }).id).toBe("http");
    expect(() => getVrmProvider({ VRM_PROVIDER: "dvla" })).toThrow(/Unknown VRM_PROVIDER/);
  });
});
