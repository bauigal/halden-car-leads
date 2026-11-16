import { describe, expect, it } from "vitest";

import { classifyVrm, formatVrm, isIssuedAgeIdentifier, isValidVrm, normaliseVrm } from "@/lib/plates";

const NOW = new Date("2026-11-16T12:00:00.000Z");

describe("UK plate normalisation", () => {
  it("uppercases and strips spaces and punctuation", () => {
    expect(normaliseVrm(" ov19 hrl ")).toBe("OV19HRL");
    expect(normaliseVrm("ov19-hrl")).toBe("OV19HRL");
  });

  it("formats each series with a single space", () => {
    expect(formatVrm("ov19hrl", NOW)).toBe("OV19 HRL");
    expect(formatVrm("w456fgt", NOW)).toBe("W456 FGT");
    expect(formatVrm("abc123a", NOW)).toBe("ABC 123A");
    expect(formatVrm("abc1234", NOW)).toBe("ABC 1234");
    expect(formatVrm("123 abc", NOW)).toBe("123 ABC");
  });
});

describe("UK plate validation", () => {
  it.each(["OV19 HRL", "BK68 YTR", "LF71 MNC", "YJ06 DKP", "XX22 AAA", "OV76 HRL", "W456 FGT", "A123 BCD", "ABC 123A", "ABC 1234", "1 ABC"])(
    "accepts %s",
    (plate) => {
      expect(isValidVrm(plate, NOW)).toBe(true);
    },
  );

  it.each(["", "   ", "HELLO", "12", "QQ11 AAA", "OV00 HRL", "OV77 HRL", "ZZ22 AAA", "A0 BCD", "IQ123"])(
    "rejects %s",
    (plate) => {
      expect(isValidVrm(plate, NOW)).toBe(false);
    },
  );

  it("classifies the four series", () => {
    expect(classifyVrm("OV19 HRL", NOW)).toBe("current");
    expect(classifyVrm("W456 FGT", NOW)).toBe("prefix");
    expect(classifyVrm("ABC 123A", NOW)).toBe("suffix");
    expect(classifyVrm("ABC 1234", NOW)).toBe("dateless");
  });

  it("accepts only age identifiers issued by the given date", () => {
    expect(isIssuedAgeIdentifier(26, NOW)).toBe(true);
    expect(isIssuedAgeIdentifier(76, NOW)).toBe(true);
    expect(isIssuedAgeIdentifier(51, NOW)).toBe(true);
    expect(isIssuedAgeIdentifier(2, NOW)).toBe(true);
    expect(isIssuedAgeIdentifier(27, NOW)).toBe(false);
    expect(isIssuedAgeIdentifier(77, NOW)).toBe(false);
    expect(isIssuedAgeIdentifier(0, NOW)).toBe(false);
    expect(isIssuedAgeIdentifier(50, NOW)).toBe(false);
    expect(isIssuedAgeIdentifier(1, NOW)).toBe(false);
  });
});
