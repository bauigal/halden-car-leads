import { z } from "zod";

import { normaliseVrm, isValidVrm } from "@/lib/plates";
import { PHOTO_MAX_BYTES, PHOTO_MAX_COUNT, PHOTO_TYPES, type PhotoMeta } from "@/lib/photos";

export const MAX_MILEAGE = 999_999;

export const CONDITIONS = ["excellent", "good", "fair", "poor"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const FAULTS = [
  "none",
  "warning_lights",
  "mechanical",
  "accident",
  "cosmetic",
  "finance",
  "no_service_history",
] as const;
export type Fault = (typeof FAULTS)[number];

export const KEYS = ["one", "two_or_more"] as const;
export type Keys = (typeof KEYS)[number];

export const LEAD_FIELDS = [
  "vrm",
  "mileage",
  "condition",
  "faults",
  "keys",
  "name",
  "phone",
  "email",
  "photos",
] as const;
export type LeadField = (typeof LEAD_FIELDS)[number];

const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*[\p{L}]$/u;

function fail(ctx: z.RefinementCtx, message: string): never {
  ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  return undefined as never;
}

export function normalisePhone(input: string): string {
  let value = input.trim().replace(/[\s().-]/g, "");
  if (value.startsWith("+44")) value = value.slice(3);
  else if (value.startsWith("0044")) value = value.slice(4);
  else return value;
  if (value.startsWith("0")) return value;
  return `0${value}`;
}

export function isValidUkPhone(normalised: string): boolean {
  return /^0(?:7\d{9}|1\d{8,9}|2\d{9}|3\d{9}|8\d{9})$/.test(normalised);
}

export function parseMileage(input: string): number | null {
  const cleaned = input.trim().replace(/[\s,]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

export const vrmSchema = z.string().transform((value, ctx) => {
  const normalised = normaliseVrm(value);
  if (!normalised) return fail(ctx, "vrm_required");
  if (!isValidVrm(normalised)) return fail(ctx, "vrm_invalid");
  return normalised;
});

export const mileageSchema = z.string().transform((value, ctx) => {
  if (!value.trim()) return fail(ctx, "mileage_required");
  const parsed = parseMileage(value);
  if (parsed === null) return fail(ctx, "mileage_invalid");
  if (parsed > MAX_MILEAGE) return fail(ctx, "mileage_range");
  return parsed;
});

export const phoneSchema = z.string().transform((value, ctx) => {
  if (!value.trim()) return fail(ctx, "phone_required");
  const normalised = normalisePhone(value);
  if (!isValidUkPhone(normalised)) return fail(ctx, "phone_invalid");
  return normalised;
});

export const emailSchema = z.string().transform((value, ctx) => {
  const email = value.trim().toLowerCase();
  if (!email) return fail(ctx, "email_required");
  const parsed = z.string().email().max(254).safeParse(email);
  if (!parsed.success) return fail(ctx, "email_invalid");
  return parsed.data;
});

export const nameSchema = z.string().transform((value, ctx) => {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return fail(ctx, "name_required");
  if (name.length > 80 || !NAME_PATTERN.test(name)) return fail(ctx, "name_invalid");
  return name;
});

const photoSchema = z.object({
  name: z.string().trim().min(1, "photos_invalid").max(180, "photos_invalid"),
  type: z.enum(PHOTO_TYPES, { message: "photos_type" }),
  size: z
    .number({ invalid_type_error: "photos_invalid" })
    .int("photos_invalid")
    .positive("photos_invalid")
    .max(PHOTO_MAX_BYTES, "photos_too_large"),
});

export const photosSchema = z
  .array(photoSchema, { invalid_type_error: "photos_invalid", required_error: "photos_invalid" })
  .max(PHOTO_MAX_COUNT, "photos_too_many");

export const plateStepSchema = z.object({
  vrm: vrmSchema,
  mileage: mileageSchema,
});

export const conditionStepSchema = z.object({
  condition: z.enum(CONDITIONS, { message: "condition_required" }),
  faults: z
    .array(z.enum(FAULTS, { message: "faults_required" }), { invalid_type_error: "faults_required" })
    .min(1, "faults_required")
    .refine((faults) => !(faults.includes("none") && faults.length > 1), "faults_conflict"),
  keys: z.enum(KEYS, { message: "keys_required" }),
  photos: photosSchema,
});

export const contactStepSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
});

export const leadSchema = plateStepSchema.merge(conditionStepSchema).merge(contactStepSchema);

export type LeadInput = z.infer<typeof leadSchema> & { photos: PhotoMeta[] };

export function fieldErrorMap(error: z.ZodError): Partial<Record<LeadField, string>> {
  const fields: Partial<Record<LeadField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    if (!(LEAD_FIELDS as readonly string[]).includes(key)) continue;
    const field = key as LeadField;
    if (!fields[field]) fields[field] = issue.message;
  }
  return fields;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function formDataToInput(formData: FormData): Record<string, unknown> {
  const photosRaw = formData.get("photos");
  let photos: unknown = [];
  if (typeof photosRaw === "string" && photosRaw.trim() !== "") {
    try {
      photos = JSON.parse(photosRaw) as unknown;
    } catch {
      photos = null;
    }
  }

  const faultsRaw = readString(formData, "faults");
  const faults = faultsRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    vrm: readString(formData, "vrm"),
    mileage: readString(formData, "mileage"),
    condition: readString(formData, "condition"),
    faults,
    keys: readString(formData, "keys"),
    name: readString(formData, "name"),
    phone: readString(formData, "phone"),
    email: readString(formData, "email"),
    photos,
  };
}
