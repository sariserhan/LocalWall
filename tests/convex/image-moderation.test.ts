import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { bakeImageForModeration } from "../../src/features/wall/image-moderation";

describe("image moderation helper", () => {
  let createdBitmap: MockBitmap | null = null;
  let drawImage: ReturnType<typeof vi.fn>;
  let toBlob: ReturnType<typeof vi.fn>;
  let canvasContext: { drawImage: ReturnType<typeof vi.fn>; imageSmoothingEnabled?: boolean; imageSmoothingQuality?: string } | null = null;

  class MockBitmap {
    width = 4000;
    height = 2000;
    close = vi.fn();
  }

  beforeEach(() => {
    createdBitmap = null;
    drawImage = vi.fn();
    toBlob = vi.fn((callback: (blob: Blob | null) => void, type: string, quality: number) => {
      callback(new Blob(["mock"], { type }));
      return undefined;
    });

    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: vi.fn(async () => {
        createdBitmap = new MockBitmap();
        return createdBitmap;
      }),
    });

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: (tag: string) => {
          expect(tag).toBe("canvas");
          canvasContext = { drawImage };
          return {
            width: 0,
            height: 0,
            getContext: () => canvasContext,
            toBlob,
          };
        },
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "createImageBitmap");
    Reflect.deleteProperty(globalThis, "document");
    vi.restoreAllMocks();
  });

  test("shrinks large images and outputs webp", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "example.png", { type: "image/png" });

    const result = await bakeImageForModeration(file);

    expect(result.name).toBe("example-moderation.webp");
    expect(result.type).toBe("image/webp");
    expect(globalThis.createImageBitmap).toHaveBeenCalledWith(file);
    expect(drawImage).toHaveBeenCalledWith(createdBitmap, 0, 0, 1600, 800);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.78);
    expect(createdBitmap?.close).toHaveBeenCalled();
  });
});
