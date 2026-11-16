export type AppEnv = Record<string, string | undefined>;

export function readEnv(env: AppEnv | NodeJS.ProcessEnv = process.env): AppEnv {
  return env;
}

export function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}
