import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const reportBug = mutation({
  args: {
    page: v.string(),
    reason: v.union(v.literal("ui-broken"), v.literal("text-unreadable"), v.literal("not-working"), v.literal("wrong-content"), v.literal("other")),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.details && args.details.length > 500) throw new Error("Bug details must be 500 characters or fewer.");
    const identity = await ctx.auth.getUserIdentity();
    const reporter = identity ? await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique() : null;
    await ctx.db.insert("bugReports", {
      reporterId: reporter?._id,
      page: args.page.slice(0, 200),
      reason: args.reason,
      details: args.details?.trim() || undefined,
      status: "open",
      createdAt: Date.now(),
    });
    return { success: true };
  },
});
