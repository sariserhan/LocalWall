import { mutation } from "./_generated/server";

export const recordLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { recorded: false };

    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return { recorded: false };

    await ctx.db.insert("authEvents", {
      userId: user._id,
      createdAt: Date.now(),
    });

    return { recorded: true };
  },
});
