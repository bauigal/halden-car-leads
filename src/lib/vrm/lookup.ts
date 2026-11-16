import type { AppEnv } from "@/lib/env";
import { vrmSchema } from "@/lib/validation";
import { getVrmProvider, UnknownVrmProviderError } from "@/lib/vrm/get-provider";
import type { LookupResponse, VrmProvider } from "@/lib/vrm/types";

export async function lookupVehicle(
  rawVrm: string,
  provider?: VrmProvider,
  env: AppEnv = process.env,
): Promise<LookupResponse> {
  const parsed = vrmSchema.safeParse(rawVrm);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message === "vrm_required" ? "vrm_required" : "vrm_invalid";
    return { httpStatus: 400, body: { ok: false, code } };
  }

  let resolved = provider;
  if (!resolved) {
    try {
      resolved = getVrmProvider(env);
    } catch (error) {
      if (error instanceof UnknownVrmProviderError) {
        return { httpStatus: 500, body: { ok: false, code: "provider_not_configured" } };
      }
      throw error;
    }
  }

  const result = await resolved.lookup(parsed.data);
  if (!result.ok) {
    const status = result.error === "provider_not_configured" ? 500 : 502;
    return { httpStatus: status, body: { ok: false, code: result.error } };
  }
  if (!result.found) {
    return { httpStatus: 404, body: { ok: true, found: false, code: "not_found" } };
  }
  return { httpStatus: 200, body: { ok: true, found: true, vehicle: result.vehicle } };
}
