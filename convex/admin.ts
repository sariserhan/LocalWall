import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { env, mutation, query } from "./_generated/server";

function configuredAdminEmails() {
  return new Set(
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function getAdminIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.trim().toLowerCase();
  if (!identity || !email || !configuredAdminEmails().has(email)) return null;
  return identity;
}

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await getAdminIdentity(ctx);
  if (!identity) throw new Error("Administrator access is required.");
  return identity;
}

export const getAccess = query({
  args: {},
  handler: async (ctx) => ({ isAdmin: Boolean(await getAdminIdentity(ctx)) }),
});

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [cards, users, reports] = await Promise.all([
      ctx.db.query("cards").order("desc").take(150),
      ctx.db.query("users").order("desc").take(150),
      ctx.db.query("reports").withIndex("by_status_and_createdAt", (q) => q.eq("status", "open")).order("desc").take(100),
    ]);
    const userById = new Map(users.map((user) => [user._id, user]));
    const cardCountByUser = new Map<string, number>();
    for (const card of cards) {
      const ownerId = String(card.ownerId);
      cardCountByUser.set(ownerId, (cardCountByUser.get(ownerId) ?? 0) + 1);
    }

    return {
      stats: {
        cards: cards.length,
        published: cards.filter((card) => card.status === "published" && card.expiresAt > Date.now()).length,
        users: users.length,
        reports: reports.length,
      },
      cards: cards.map((card) => {
        const owner = userById.get(card.ownerId);
        return {
          id: card._id,
          name: card.name,
          line: card.line,
          area: card.area,
          city: card.city,
          state: card.state,
          country: card.country,
          status: card.status === "published" && card.expiresAt <= Date.now() ? "expired" as const : card.status,
          ownerName: owner?.displayName,
          ownerEmail: owner?.email,
          clicks: card.clicks,
          expiresAt: card.expiresAt,
          createdAt: card.createdAt,
        };
      }),
      users: users.map((user) => ({
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        blockedAt: user.blockedAt,
        blockedReason: user.blockedReason,
        createdAt: user.createdAt,
        cardCount: cardCountByUser.get(String(user._id)) ?? 0,
      })),
      reports: await Promise.all(reports.map(async (report) => {
        const card = await ctx.db.get(report.cardId);
        return { id: report._id, cardId: report.cardId, cardName: card?.name ?? "Deleted card", reason: report.reason, details: report.details, createdAt: report.createdAt };
      })),
    };
  },
});

export const resolveReport = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("That report no longer exists.");
    await ctx.db.patch(report._id, { status: "resolved" });
    return { success: true };
  },
});

export const setCardStatus = mutation({
  args: {
    cardId: v.id("cards"),
    status: v.union(v.literal("published"), v.literal("hidden")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("That card no longer exists.");
    if (args.status === "published" && card.expiresAt <= Date.now()) throw new Error("Expired cards cannot be restored without renewal.");
    await ctx.db.patch(card._id, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});

export const removeCard = mutation({
  args: { cardId: v.id("cards") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("That card no longer exists.");
    const storedImages = new Set([...card.imageIds, ...(card.thumbnailImageIds ?? [])]);
    await Promise.all([...storedImages].map((imageId) => ctx.storage.delete(imageId)));
    await ctx.db.delete(card._id);
    return { success: true };
  },
});

export const blockUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("That user no longer exists.");

    const now = Date.now();
    await ctx.db.patch(user._id, {
      blockedAt: now,
      blockedReason: "Blocked by admin moderation",
    });

    const cards = await ctx.db.query("cards").withIndex("by_owner", (q) => q.eq("ownerId", args.userId)).take(500);
    await Promise.all(cards.map(async (card) => {
      if (card.status === "expired") return;
      await ctx.db.patch(card._id, {
        status: "hidden",
        updatedAt: now,
      });
    }));

    return { success: true, hiddenCards: cards.filter((card) => card.status !== "expired").length };
  },
});

export const unblockUser = mutation({
  args: {
    userId: v.id("users"),
    restoreCards: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("That user no longer exists.");

    await ctx.db.patch(user._id, {
      blockedAt: undefined,
      blockedReason: undefined,
    });

    if (!args.restoreCards) {
      return { success: true, restoredCards: 0 };
    }

    const cards = await ctx.db.query("cards").withIndex("by_owner", (q) => q.eq("ownerId", args.userId)).take(500);
    const now = Date.now();
    let restoredCards = 0;
    await Promise.all(cards.map(async (card) => {
      if (card.status !== "hidden" || card.expiresAt <= now) return;
      restoredCards += 1;
      await ctx.db.patch(card._id, {
        status: "published",
        updatedAt: now,
      });
    }));

    return { success: true, restoredCards };
  },
});
