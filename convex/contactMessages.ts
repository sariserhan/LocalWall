import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const sendContactMessage = mutation({
  args: {
    page: v.string(),
    topic: v.string(),
    message: v.string(),
    reporterDisplayName: v.optional(v.string()),
    reporterUsername: v.optional(v.string()),
    reporterEmail: v.optional(v.string()),
    reporterBusinessName: v.optional(v.string()),
    reporterPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const topic = args.topic.trim();
    const message = args.message.trim();
    if (!topic) throw new Error("Please add a topic.");
    if (!message) throw new Error("Please add a message.");
    if (topic.length > 120) throw new Error("Topic must be 120 characters or fewer.");
    if (message.length > 1000) throw new Error("Message must be 1000 characters or fewer.");

    const identity = await ctx.auth.getUserIdentity();
    const reporter = identity ? await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique() : null;
    await ctx.db.insert("contactMessages", {
      reporterId: reporter?._id,
      page: args.page.slice(0, 200),
      topic,
      message,
      reporterDisplayName: args.reporterDisplayName?.trim() || reporter?.displayName || undefined,
      reporterUsername: args.reporterUsername?.trim() || reporter?.username || undefined,
      reporterEmail: args.reporterEmail?.trim() || reporter?.email || undefined,
      reporterBusinessName: args.reporterBusinessName?.trim() || reporter?.businessName || undefined,
      reporterPhone: args.reporterPhone?.trim() || undefined,
      status: "open",
      createdAt: Date.now(),
    });
    return { success: true };
  },
});
