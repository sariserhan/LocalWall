import { v } from "convex/values";
import { mutation } from "./_generated/server";

const scopeValidator = v.union(
  v.literal("moderation_5m"),
  v.literal("moderation_day"),
  v.literal("checkout_hour"),
  v.literal("checkout_day"),
);

const quotas = {
  moderation_5m: { limit: 8, windowMs: 5 * 60 * 1000 },
  moderation_day: { limit: 100, windowMs: 24 * 60 * 60 * 1000 },
  checkout_hour: { limit: 10, windowMs: 60 * 60 * 1000 },
  checkout_day: { limit: 30, windowMs: 24 * 60 * 60 * 1000 },
} as const;

export const take = mutation({
  args: { scopes: v.array(scopeValidator) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication is required.");
    const scopes = [...new Set(args.scopes)];
    if (scopes.length === 0 || scopes.length > 2) throw new Error("Invalid rate-limit scopes.");

    const now = Date.now();
    const buckets = await Promise.all(scopes.map(async (scope) => {
      const quota = quotas[scope];
      const key = `${identity.tokenIdentifier}:${scope}`;
      const existing = await ctx.db.query("rateLimits").withIndex("by_key", (q) => q.eq("key", key)).unique();
      const resetAt = !existing || existing.resetAt <= now ? now + quota.windowMs : existing.resetAt;
      const count = !existing || existing.resetAt <= now ? 0 : existing.count;
      return { scope, quota, key, existing, resetAt, count };
    }));

    const blocked = buckets.find((bucket) => bucket.count >= bucket.quota.limit);
    if (blocked) return { allowed: false, scope: blocked.scope, limit: blocked.quota.limit, remaining: 0, resetAt: blocked.resetAt };

    await Promise.all(buckets.map(async (bucket) => {
      const next = { count: bucket.count + 1, resetAt: bucket.resetAt, updatedAt: now };
      if (bucket.existing) await ctx.db.patch(bucket.existing._id, next);
      else await ctx.db.insert("rateLimits", { key: bucket.key, ...next });
    }));

    const tightest = buckets.reduce((current, bucket) => {
      const remaining = bucket.quota.limit - bucket.count - 1;
      const currentRemaining = current.quota.limit - current.count - 1;
      return remaining < currentRemaining ? bucket : current;
    });
    return { allowed: true, scope: tightest.scope, limit: tightest.quota.limit, remaining: tightest.quota.limit - tightest.count - 1, resetAt: tightest.resetAt };
  },
});
