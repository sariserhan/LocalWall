import { expect, test, describe } from "vitest";
import { internal } from "../../convex/_generated/api";
import { makeT } from "./helpers";

describe("purgeStale", () => {
  test("deletes expired rate-limit buckets and keeps fresh ones", async () => {
    const t = makeT();
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("rateLimits", {
        key: "stale-user:card_create_hour",
        username: "stale-user",
        count: 10,
        resetAt: now - 2 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      });
      await ctx.db.insert("rateLimits", {
        key: "fresh-user:card_create_hour",
        username: "fresh-user",
        count: 2,
        resetAt: now + 60 * 60 * 1000,
        updatedAt: now,
      });
    });

    const result = await t.mutation(internal.rateLimits.purgeStale, {});
    expect(result.deleted).toBe(1);
    expect(result.scheduledMore).toBe(false);

    const remaining = await t.run(async (ctx) => ctx.db.query("rateLimits").collect());
    expect(remaining).toHaveLength(1);
    expect(remaining[0].key).toBe("fresh-user:card_create_hour");
  });
});
