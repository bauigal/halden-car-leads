import { normaliseVrm } from "@/lib/plates";
import type { ProviderLookup, VehicleDetails, VrmProvider } from "@/lib/vrm/types";

/**
 * Deterministic demo stock. Keys are normalised registrations.
 * Update the README table when this list changes.
 */
export const DEMO_VEHICLES: readonly VehicleDetails[] = [
  {
    vrm: "OV19 HRL",
    make: "Volvo",
    model: "XC40",
    year: 2019,
    fuel: "Petrol",
    engineSizeCc: 1969,
    colour: "Denim blue",
  },
  {
    vrm: "BK68 YTR",
    make: "Volkswagen",
    model: "Polo",
    year: 2018,
    fuel: "Petrol",
    engineSizeCc: 999,
    colour: "Pure white",
  },
  {
    vrm: "LF71 MNC",
    make: "Tesla",
    model: "Model 3",
    year: 2021,
    fuel: "Electric",
    engineSizeCc: null,
    colour: "Midnight silver",
  },
  {
    vrm: "YJ06 DKP",
    make: "Ford",
    model: "Fiesta",
    year: 2006,
    fuel: "Petrol",
    engineSizeCc: 1388,
    colour: "Panther black",
  },
  {
    vrm: "W456 FGT",
    make: "Vauxhall",
    model: "Corsa",
    year: 2000,
    fuel: "Petrol",
    engineSizeCc: 1199,
    colour: "Rio red",
  },
  {
    vrm: "A123 BCD",
    make: "Ford",
    model: "Sierra",
    year: 1983,
    fuel: "Petrol",
    engineSizeCc: 1993,
    colour: "Champagne",
  },
  {
    vrm: "ABC 123A",
    make: "Morris",
    model: "Minor",
    year: 1963,
    fuel: "Petrol",
    engineSizeCc: 1098,
    colour: "Traveller green",
  },
];

const BY_VRM = new Map(DEMO_VEHICLES.map((vehicle) => [normaliseVrm(vehicle.vrm), vehicle]));

export class MockVrmProvider implements VrmProvider {
  readonly id = "mock";

  async lookup(vrm: string): Promise<ProviderLookup> {
    const vehicle = BY_VRM.get(normaliseVrm(vrm));
    if (!vehicle) return { ok: true, found: false };
    return { ok: true, found: true, vehicle };
  }
}
