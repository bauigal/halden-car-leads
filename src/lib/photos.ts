export const PHOTO_MAX_COUNT = 6;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type PhotoType = (typeof PHOTO_TYPES)[number];

const EXTENSIONS: Record<string, PhotoType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export type PhotoMeta = {
  name: string;
  type: PhotoType;
  size: number;
};

export type PhotoProblem = "photos_type" | "photos_too_large" | "photos_too_many" | "photos_invalid";

export function resolvePhotoType(file: { name: string; type: string }): PhotoType | null {
  if ((PHOTO_TYPES as readonly string[]).includes(file.type)) return file.type as PhotoType;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONS[extension] ?? null;
}

export function validatePhotoSelection(
  existingCount: number,
  incoming: { name: string; type: string; size: number }[],
): { accept: PhotoMeta[]; error?: PhotoProblem } {
  const accept: PhotoMeta[] = [];
  let error: PhotoProblem | undefined;
  let count = existingCount;

  for (const file of incoming) {
    const type = resolvePhotoType(file);
    if (!type) {
      error ??= "photos_type";
      continue;
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
      error ??= "photos_invalid";
      continue;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      error ??= "photos_too_large";
      continue;
    }
    if (count >= PHOTO_MAX_COUNT) {
      error ??= "photos_too_many";
      continue;
    }
    const name = file.name.trim().slice(0, 180);
    if (!name) {
      error ??= "photos_invalid";
      continue;
    }
    accept.push({ name, type, size: Math.round(file.size) });
    count += 1;
  }

  return { accept, error };
}

/**
 * Demo storage. Bytes are never accepted; callers pass metadata only.
 * A production adapter should upload directly to Vercel Blob (or similar)
 * because Vercel function bodies are limited to 4.5 MB.
 */
export type PhotoStoreResult = { mode: "noop"; count: number };

export interface PhotoStore {
  readonly id: string;
  save(photos: PhotoMeta[]): Promise<PhotoStoreResult>;
}

export class NoopPhotoStore implements PhotoStore {
  readonly id = "noop";

  async save(photos: PhotoMeta[]): Promise<PhotoStoreResult> {
    return { mode: "noop", count: photos.length };
  }
}
