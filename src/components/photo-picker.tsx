"use client";

import { useId } from "react";

import { copy } from "@/content/copy";
import { validatePhotoSelection } from "@/lib/photos";

export type LocalPhoto = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

export function PhotoPicker({
  photos,
  error,
  onChange,
  onError,
}: {
  photos: LocalPhoto[];
  error?: string;
  onChange: (photos: LocalPhoto[]) => void;
  onError: (message: string | undefined) => void;
}) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ");

  function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    const accepted: LocalPhoto[] = [];
    let problem: string | undefined;
    let count = photos.length;

    for (const file of files) {
      const result = validatePhotoSelection(count, [file]);
      const meta = result.accept[0];
      if (!meta || result.error) {
        problem ??= result.error ?? "photos_invalid";
        continue;
      }
      accepted.push({
        ...meta,
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
      });
      count += 1;
    }

    onError(problem);
    if (accepted.length > 0) onChange([...photos, ...accepted]);
  }

  function remove(id: string) {
    const target = photos.find((photo) => photo.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(photos.filter((photo) => photo.id !== id));
    onError(undefined);
  }

  return (
    <div className="grid gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {copy.flow.condition.photosLabel}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
          multiple
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="pointer-events-none flex min-h-11 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/60 px-4 py-3 text-sm font-medium peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
          {copy.flow.condition.addPhotos}
        </div>
      </div>
      <p id={hintId} className="text-sm text-muted-foreground">
        {copy.flow.condition.photosHint}
      </p>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {photos.length > 0 ? (
        <ul className="grid gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
              {photo.type === "image/heic" || photo.type === "image/heif" ? (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-medium">HEIC</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm">{photo.name}</span>
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                onClick={() => remove(photo.id)}
              >
                {copy.flow.condition.removePhoto}
                <span className="sr-only"> {photo.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function revokePhotos(photos: LocalPhoto[]) {
  for (const photo of photos) URL.revokeObjectURL(photo.url);
}
