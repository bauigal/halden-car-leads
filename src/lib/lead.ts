import type { AppEnv } from "@/lib/env";
import { getNotifiers } from "@/lib/notify/get-notifiers";
import { NotifierConfigError, type LeadNotification, type LeadNotifier } from "@/lib/notify/types";
import { NoopPhotoStore, type PhotoStore } from "@/lib/photos";
import type { LeadResult } from "@/lib/lead-result";
import { fieldErrorMap, leadSchema } from "@/lib/validation";
import { getVrmProvider, UnknownVrmProviderError } from "@/lib/vrm/get-provider";
import type { VrmProvider } from "@/lib/vrm/types";

export type { LeadResult } from "@/lib/lead-result";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type LeadDeps = {
  provider: VrmProvider;
  notifiers: LeadNotifier[];
  photoStore: PhotoStore;
  now: () => Date;
  reference: () => string;
};

export function createReference(bytes?: Uint8Array): string {
  const values = bytes ?? crypto.getRandomValues(new Uint8Array(4));
  let suffix = "";
  for (const value of values) {
    suffix += REFERENCE_ALPHABET[value % REFERENCE_ALPHABET.length];
  }
  return `HLD-${suffix}`;
}

export function defaultLeadDeps(env: AppEnv = process.env): LeadDeps {
  return {
    provider: getVrmProvider(env),
    notifiers: getNotifiers(env),
    photoStore: new NoopPhotoStore(),
    now: () => new Date(),
    reference: () => createReference(),
  };
}

export async function createLead(input: unknown, deps?: Partial<LeadDeps>, env: AppEnv = process.env): Promise<LeadResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = fieldErrorMap(parsed.error);
    const code = parsed.error.issues[0]?.message ?? "submit_failed";
    return { status: "error", code, fieldErrors };
  }

  const needsDefaults = !deps?.provider || !deps.notifiers || !deps.photoStore;
  const defaults = needsDefaults ? safeDefaults(env) : null;
  if (defaults && "error" in defaults) return { status: "error", code: defaults.error };

  const resolved: LeadDeps = {
    provider: deps?.provider ?? defaults!.provider,
    notifiers: deps?.notifiers ?? defaults!.notifiers,
    photoStore: deps?.photoStore ?? defaults!.photoStore,
    now: deps?.now ?? defaults?.now ?? (() => new Date()),
    reference: deps?.reference ?? defaults?.reference ?? (() => createReference()),
  };

  const lookup = await resolved.provider.lookup(parsed.data.vrm);
  if (!lookup.ok) return { status: "error", code: lookup.error, fieldErrors: { vrm: lookup.error } };
  if (!lookup.found) return { status: "error", code: "not_found", fieldErrors: { vrm: "not_found" } };

  const stored = await resolved.photoStore.save(parsed.data.photos);
  const notification: LeadNotification = {
    reference: resolved.reference(),
    submittedAt: resolved.now().toISOString(),
    contact: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
    },
    vehicle: lookup.vehicle,
    mileage: parsed.data.mileage,
    condition: parsed.data.condition,
    faults: parsed.data.faults,
    keys: parsed.data.keys,
    photos: parsed.data.photos,
    photoStorage: stored.mode,
  };

  try {
    await Promise.all(resolved.notifiers.map((notifier) => notifier.notify(notification)));
  } catch {
    console.error("[halden] notifier failed");
    return { status: "error", code: "submit_failed" };
  }

  return {
    status: "success",
    reference: notification.reference,
    vehicle: notification.vehicle,
    mileage: notification.mileage,
    photoCount: notification.photos.length,
  };
}

function safeDefaults(env: AppEnv): LeadDeps | { error: "notifier_not_configured" | "provider_not_configured" } {
  try {
    return defaultLeadDeps(env);
  } catch (error) {
    if (error instanceof NotifierConfigError) return { error: "notifier_not_configured" };
    if (error instanceof UnknownVrmProviderError) return { error: "provider_not_configured" };
    throw error;
  }
}
