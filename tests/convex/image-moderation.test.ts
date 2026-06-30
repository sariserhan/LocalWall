import { describe, expect, test } from "vitest";
import { buildModerationBatches } from "../../src/features/wall/image-moderation";

describe("image moderation batching", () => {
  test("sends each front image and back image in its own moderation request", () => {
    const frontA = new File(["a"], "front-a.png", { type: "image/png" });
    const frontB = new File(["b"], "front-b.png", { type: "image/png" });
    const back = new File(["c"], "back.png", { type: "image/png" });

    const batches = buildModerationBatches([frontA, frontB], [back]);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toEqual([frontA]);
    expect(batches[1]).toEqual([frontB]);
    expect(batches[2]).toEqual([back]);
  });

  test("ignores extra front images beyond the first two", () => {
    const frontA = new File(["a"], "front-a.png", { type: "image/png" });
    const frontB = new File(["b"], "front-b.png", { type: "image/png" });
    const frontC = new File(["c"], "front-c.png", { type: "image/png" });

    const batches = buildModerationBatches([frontA, frontB, frontC], []);

    expect(batches).toHaveLength(2);
    expect(batches.map((batch) => batch[0])).toEqual([frontA, frontB]);
  });
});
