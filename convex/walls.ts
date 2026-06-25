import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const recordVisit = mutation({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    const path = args.path.toLowerCase().replace(/\/+$/, "") || "/";

    const identity = await ctx.auth.getUserIdentity();
    let userId: Id<"users"> | undefined;
    if (identity) {
      const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
      if (user) userId = user._id;
    }

    const now = Date.now();
    const existing = await ctx.db.query("walls").withIndex("by_path", (q) => q.eq("path", path)).unique();

    let wallId: Id<"walls">;
    let viewCount: number;

    if (existing) {
      viewCount = existing.viewCount + 1;
      await ctx.db.patch(existing._id, { viewCount, updatedAt: now });
      wallId = existing._id;
    } else {
      viewCount = 1;
      wallId = await ctx.db.insert("walls", { path, viewCount: 1, createdBy: userId, createdAt: now, updatedAt: now });
    }

    await ctx.db.insert("wallVisits", { wallId, userId, visitedAt: now });

    return { viewCount };
  },
});

export const getWall = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    const path = args.path.toLowerCase().replace(/\/+$/, "") || "/";
    const wall = await ctx.db.query("walls").withIndex("by_path", (q) => q.eq("path", path)).unique();
    if (!wall) return null;
    return { id: wall._id, path: wall.path, viewCount: wall.viewCount, createdAt: wall.createdAt, updatedAt: wall.updatedAt };
  },
});

export const getTopWalls = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const walls = await ctx.db.query("walls").collect();
    const seen = new Set<string>();
    return walls
      .filter((w) => {
        const parts = w.path.split("/").filter(Boolean);
        return w.viewCount > 0 && parts.length === 3;
      })
      .sort((a, b) => b.viewCount - a.viewCount)
      .filter((w) => {
        if (seen.has(w.path)) return false;
        seen.add(w.path);
        return true;
      })
      .slice(0, args.limit ?? 20)
      .map((w) => ({ path: w.path, viewCount: w.viewCount }));
  },
});

export const getVisitors = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    const path = args.path.toLowerCase().replace(/\/+$/, "") || "/";
    const wall = await ctx.db.query("walls").withIndex("by_path", (q) => q.eq("path", path)).unique();
    if (!wall) return [];
    const visits = await ctx.db.query("wallVisits").withIndex("by_wall", (q) => q.eq("wallId", wall._id)).order("desc").take(500);
    return visits.map((v) => ({ userId: v.userId, visitedAt: v.visitedAt }));
  },
});
