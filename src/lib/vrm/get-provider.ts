import type { AppEnv } from "@/lib/env";
import { HttpVrmProvider } from "@/lib/vrm/http-provider";
import { MockVrmProvider } from "@/lib/vrm/mock-provider";
import type { VrmProvider } from "@/lib/vrm/types";

export class UnknownVrmProviderError extends Error {
  constructor(name: string) {
    super(`Unknown VRM_PROVIDER "${name}". Use "mock" or "http".`);
    this.name = "UnknownVrmProviderError";
  }
}

export function getVrmProvider(env: AppEnv = process.env): VrmProvider {
  const name = (env.VRM_PROVIDER ?? "mock").trim().toLowerCase();
  if (name === "" || name === "mock") return new MockVrmProvider();
  if (name === "http") return new HttpVrmProvider(env);
  throw new UnknownVrmProviderError(name);
}
