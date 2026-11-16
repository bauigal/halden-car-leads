export function formatMileage(miles: number): string {
  return `${miles.toLocaleString("en-GB")} miles`;
}

export function formatEngine(engineSizeCc: number): string {
  return `${engineSizeCc.toLocaleString("en-GB")} cc`;
}

export function formatPhoneDisplay(normalised: string): string {
  if (/^07\d{9}$/.test(normalised)) {
    return `${normalised.slice(0, 5)} ${normalised.slice(5)}`;
  }
  return normalised;
}
