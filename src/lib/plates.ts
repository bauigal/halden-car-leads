/**
 * Practical UK plate checks for a lead form.
 *
 * Covers the current (2001–) format, prefix (1983–2001), suffix (1963–1983),
 * and dateless / Northern Ireland styles. It is not a DVLA replica: it does
 * not apply the banned-word list or the special diplomatic and military series.
 *
 * Current-format age identifiers are accepted only when that code has been
 * issued by the given date (UTC).
 */

const AGE_LETTERS = new Set("ABCDEFGHJKLMNPRSTVWXY".split(""));

export type PlateKind = "current" | "prefix" | "suffix" | "dateless";

export function normaliseVrm(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isIssuedAgeIdentifier(code: number, now = new Date()): boolean {
  if (!Number.isInteger(code)) return false;

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const latestMarchYear = month >= 3 ? year : year - 1;
  const latestSeptemberYear = month >= 9 ? year : year - 1;
  const latestMarchCode = latestMarchYear - 2000;
  const latestSeptemberCode = 50 + (latestSeptemberYear - 2000);

  if (code >= 2 && code <= latestMarchCode && code < 50) return true;
  if (code >= 51 && code <= latestSeptemberCode) return true;
  return false;
}

function hasLetters(value: string, banned: RegExp): boolean {
  return !banned.test(value);
}

function isCurrent(vrm: string, now: Date): boolean {
  if (!/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(vrm)) return false;
  const memory = vrm.slice(0, 2);
  const age = Number(vrm.slice(2, 4));
  const random = vrm.slice(4);
  if (!hasLetters(memory, /[IQZ]/)) return false;
  if (!hasLetters(random, /[IQ]/)) return false;
  return isIssuedAgeIdentifier(age, now);
}

function isPrefix(vrm: string): boolean {
  const match = /^([A-Z])(\d{1,3})([A-Z]{3})$/.exec(vrm);
  if (!match) return false;
  const [, age, serial, letters] = match;
  if (!age || !serial || !letters) return false;
  if (!AGE_LETTERS.has(age)) return false;
  if (serial.startsWith("0")) return false;
  return hasLetters(letters, /[IQ]/);
}

function isSuffix(vrm: string): boolean {
  const match = /^([A-Z]{3})(\d{1,3})([A-Z])$/.exec(vrm);
  if (!match) return false;
  const [, letters, serial, age] = match;
  if (!letters || !serial || !age) return false;
  if (!hasLetters(letters, /[IQ]/)) return false;
  if (serial.startsWith("0")) return false;
  return AGE_LETTERS.has(age);
}

function isDateless(vrm: string): boolean {
  if (vrm.length < 2 || vrm.length > 7) return false;
  const forward = /^([A-Z]{1,3})(\d{1,4})$/.exec(vrm);
  const reverse = /^(\d{1,4})([A-Z]{1,3})$/.exec(vrm);
  const match = forward ?? reverse;
  if (!match) return false;
  const letters = forward ? match[1] : match[2];
  const digits = forward ? match[2] : match[1];
  if (!letters || !digits) return false;
  if (digits.startsWith("0")) return false;
  return hasLetters(letters, /[IQ]/);
}

export function classifyVrm(input: string, now = new Date()): PlateKind | null {
  const vrm = normaliseVrm(input);
  if (isCurrent(vrm, now)) return "current";
  if (isPrefix(vrm)) return "prefix";
  if (isSuffix(vrm)) return "suffix";
  if (isDateless(vrm)) return "dateless";
  return null;
}

export function isValidVrm(input: string, now = new Date()): boolean {
  return classifyVrm(input, now) !== null;
}

export function formatVrm(input: string, now = new Date()): string {
  const vrm = normaliseVrm(input);
  const kind = classifyVrm(vrm, now);
  if (kind === "current") return `${vrm.slice(0, 4)} ${vrm.slice(4)}`;
  if (kind === "prefix") return `${vrm.slice(0, -3)} ${vrm.slice(-3)}`;
  if (kind === "suffix") return `${vrm.slice(0, 3)} ${vrm.slice(3)}`;
  if (kind === "dateless") {
    const match = /^([A-Z]+)(\d+)$/.exec(vrm) ?? /^(\d+)([A-Z]+)$/.exec(vrm);
    if (match?.[1] && match[2]) return `${match[1]} ${match[2]}`;
  }
  return vrm;
}
