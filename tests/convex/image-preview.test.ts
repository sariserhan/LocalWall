import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPreviewUrl } from "../../src/features/wall/image-preview";

describe("image preview helper", () => {
  let drawImage: ReturnType<typeof vi.fn>;
  let toBlob: ReturnType<typeof vi.fn>;

  class MockBitmap {
    width = 4000;
    height = 2000;
    close = vi.fn();
  }

  beforeEach(() => {
    drawImage = vi.fn();
    toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob(["thumb"], { type: "image/webp" }));
      return undefined;
    });

    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: vi.fn(async () => new MockBitmap()),
    });

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: (tag: string) => {
          expect(tag).toBe("canvas");
          return {
            width: 0,
            height: 0,
            getContext: () => ({ drawImage, imageSmoothingEnabled: false, imageSmoothingQuality: "low" }),
            toBlob,
          };
        },
      },
    });

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:preview"),
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "createImageBitmap");
    Reflect.deleteProperty(globalThis, "document");
    vi.restoreAllMocks();
  });

  test("creates a smaller preview blob", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "image.png", { type: "image/png" });

    const url = await createPreviewUrl(file);

    expect(globalThis.createImageBitmap).toHaveBeenCalledWith(file);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 320);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.78);
    expect(url).toBe("blob:preview");
  });
});
