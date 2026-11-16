import { describe, expect, it } from "vitest";

import { NoopPhotoStore, PHOTO_MAX_BYTES, PHOTO_MAX_COUNT, validatePhotoSelection } from "@/lib/photos";

describe("photo selection", () => {
  it("accepts jpeg, png, webp and heic, including a blank mime with a known extension", () => {
    const result = validatePhotoSelection(0, [
      { name: "front.jpg", type: "image/jpeg", size: 1000 },
      { name: "side.PNG", type: "", size: 1000 },
      { name: "rear.webp", type: "image/webp", size: 1000 },
      { name: "dash.heic", type: "", size: 1000 },
    ]);
    expect(result.error).toBeUndefined();
    expect(result.accept.map((photo) => photo.type)).toEqual(["image/jpeg", "image/png", "image/webp", "image/heic"]);
  });

  it("skips the wrong type and files over 5 MB", () => {
    const wrongType = validatePhotoSelection(0, [{ name: "notes.pdf", type: "application/pdf", size: 1000 }]);
    expect(wrongType.accept).toHaveLength(0);
    expect(wrongType.error).toBe("photos_type");

    const tooBig = validatePhotoSelection(0, [{ name: "front.jpg", type: "image/jpeg", size: PHOTO_MAX_BYTES + 1 }]);
    expect(tooBig.error).toBe("photos_too_large");

    const empty = validatePhotoSelection(0, [{ name: "front.jpg", type: "image/jpeg", size: 0 }]);
    expect(empty.error).toBe("photos_invalid");
  });

  it("stops at six photos and keeps the ones that still fit", () => {
    const incoming = Array.from({ length: 3 }, (_, index) => ({
      name: `${index}.jpg`,
      type: "image/jpeg",
      size: 10,
    }));
    const result = validatePhotoSelection(PHOTO_MAX_COUNT - 1, incoming);
    expect(result.accept).toHaveLength(1);
    expect(result.error).toBe("photos_too_many");
  });

  it("stores nothing in demo mode", async () => {
    const stored = await new NoopPhotoStore().save([{ name: "a.jpg", type: "image/jpeg", size: 10 }]);
    expect(stored).toEqual({ mode: "noop", count: 1 });
  });
});
