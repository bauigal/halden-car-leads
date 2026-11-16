import { describe, expect, it } from "vitest";

import { copy } from "@/content/copy";
import { PHOTO_MAX_BYTES } from "@/lib/photos";
import {
  CONDITIONS,
  contactStepSchema,
  FAULTS,
  fieldErrorMap,
  formDataToInput,
  KEYS,
  leadSchema,
  mileageSchema,
  phoneSchema,
} from "@/lib/validation";

const validLead = {
  vrm: "ov19 hrl",
  mileage: "48,000",
  condition: "good",
  faults: ["cosmetic"],
  keys: "two_or_more",
  name: "Ada Lovelace",
  phone: "+44 7700 900123",
  email: "Ada@Example.com",
  photos: [{ name: "front.jpg", type: "image/jpeg", size: 1200 }],
};

describe("mileage, phone, email and name", () => {
  it("parses mileage with commas and spaces", () => {
    expect(mileageSchema.parse("48,000")).toBe(48000);
    expect(mileageSchema.parse("48 000")).toBe(48000);
    expect(mileageSchema.parse("0")).toBe(0);
    expect(mileageSchema.safeParse("").error?.issues[0]?.message).toBe("mileage_required");
    expect(mileageSchema.safeParse("48.000").error?.issues[0]?.message).toBe("mileage_invalid");
    expect(mileageSchema.safeParse("1000000").error?.issues[0]?.message).toBe("mileage_range");
    expect(mileageSchema.safeParse("-5").error?.issues[0]?.message).toBe("mileage_invalid");
  });

  it("accepts UK mobiles and landlines and rejects everything else", () => {
    expect(phoneSchema.parse("07700 900123")).toBe("07700900123");
    expect(phoneSchema.parse("+44 (0)7700 900123")).toBe("07700900123");
    expect(phoneSchema.parse("+44 7700 900123")).toBe("07700900123");
    expect(phoneSchema.parse("0044 20 7946 0991")).toBe("02079460991");
    expect(phoneSchema.parse("020 7946 0991")).toBe("02079460991");
    expect(phoneSchema.safeParse("").error?.issues[0]?.message).toBe("phone_required");
    expect(phoneSchema.safeParse("0770090012").error?.issues[0]?.message).toBe("phone_invalid");
    expect(phoneSchema.safeParse("+1 202 555 0100").error?.issues[0]?.message).toBe("phone_invalid");
  });

  it("normalises a full lead", () => {
    const parsed = leadSchema.parse(validLead);
    expect(parsed.vrm).toBe("OV19HRL");
    expect(parsed.mileage).toBe(48000);
    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBe("07700900123");
    expect(parsed.name).toBe("Ada Lovelace");
  });

  it("rejects an incomplete contact", () => {
    const result = contactStepSchema.safeParse({ name: "A", phone: "123", email: "ada@" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorMap(result.error)).toMatchObject({
        name: "name_invalid",
        phone: "phone_invalid",
        email: "email_invalid",
      });
    }
  });

  it("requires a fault choice and keeps none exclusive", () => {
    expect(leadSchema.safeParse({ ...validLead, faults: [] }).success).toBe(false);
    const conflict = leadSchema.safeParse({ ...validLead, faults: ["none", "cosmetic"] });
    expect(conflict.success).toBe(false);
    if (!conflict.success) expect(fieldErrorMap(conflict.error).faults).toBe("faults_conflict");
    expect(leadSchema.safeParse({ ...validLead, faults: ["none"] }).success).toBe(true);
  });

  it("rejects a photo that is too large or the wrong type", () => {
    const huge = leadSchema.safeParse({
      ...validLead,
      photos: [{ name: "big.jpg", type: "image/jpeg", size: PHOTO_MAX_BYTES + 1 }],
    });
    expect(huge.success).toBe(false);
    if (!huge.success) expect(fieldErrorMap(huge.error).photos).toBe("photos_too_large");

    const gif = leadSchema.safeParse({
      ...validLead,
      photos: [{ name: "anim.gif", type: "image/gif", size: 1000 }],
    });
    expect(gif.success).toBe(false);
    if (!gif.success) expect(fieldErrorMap(gif.error).photos).toBe("photos_type");
  });

  it("reads a submitted form", () => {
    const form = new FormData();
    form.set("vrm", "OV19 HRL");
    form.set("mileage", "10,000");
    form.set("condition", "fair");
    form.set("faults", "mechanical,cosmetic");
    form.set("keys", "one");
    form.set("name", "Grace Hopper");
    form.set("phone", "07700900123");
    form.set("email", "grace@example.com");
    form.set("photos", JSON.stringify([{ name: "side.png", type: "image/png", size: 50 }]));
    const input = formDataToInput(form);
    expect(leadSchema.parse(input).faults).toEqual(["mechanical", "cosmetic"]);
  });

  it("marks broken photo JSON as invalid", () => {
    const form = new FormData();
    form.set("photos", "{");
    expect(formDataToInput(form).photos).toBeNull();
  });
});

describe("copy stays aligned with the validators", () => {
  it("has a label for every condition, fault and key", () => {
    expect(copy.flow.conditions.map((item) => item.value).sort()).toEqual([...CONDITIONS].sort());
    expect(copy.flow.faults.map((item) => item.value).sort()).toEqual([...FAULTS].sort());
    expect(copy.flow.keys.map((item) => item.value).sort()).toEqual([...KEYS].sort());
  });
});
