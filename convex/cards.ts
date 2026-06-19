import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const category = v.union(v.literal("Services"), v.literal("Food"), v.literal("Home"), v.literal("Classes"), v.literal("Pets"), v.literal("Repairs"), v.literal("Shops"));
const theme = v.union(v.literal("yellow"), v.literal("paper"), v.literal("pink"), v.literal("cyan"), v.literal("dark"), v.literal("cream"));

async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string; subject: string; name?: string; email?: string; pictureUrl?: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must sign in to post a card.");
  return identity;
}

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_status_created", (q) => q.eq("status", "published"))
      .order("asc")
      .take(200);

    return Promise.all(cards.map(async (card) => {
      const urls = await Promise.all(card.imageIds.map((imageId: Id<"_storage">) => ctx.storage.getUrl(imageId)));
      return {
        id: card._id,
        ownerId: card.ownerId,
        name: card.name,
        category: card.category,
        line: card.line,
        area: card.area,
        price: card.price,
        theme: card.theme,
        images: urls.filter((url): url is string => url !== null),
        x: card.x,
        y: card.y,
        rotation: card.rotation,
        width: card.width,
        zIndex: card.zIndex,
        positionLockedAt: card.positionLockedAt,
        createdAt: card.createdAt,
      };
    }));
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category,
    line: v.string(),
    area: v.string(),
    price: v.optional(v.string()),
    theme,
    imageIds: v.array(v.id("_storage")),
    x: v.number(),
    y: v.number(),
    rotation: v.number(),
    width: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (args.imageIds.length > 2) throw new Error("A card can have at most two images.");
    if (!args.name.trim() || args.name.length > 60) throw new Error("Business name must be between 1 and 60 characters.");
    if (!args.line.trim() || args.line.length > 90) throw new Error("Service description must be between 1 and 90 characters.");
    if (!args.area.trim() || args.area.length > 50) throw new Error("Neighborhood must be between 1 and 50 characters.");
    if (args.x < 0 || args.x > 88 || args.y < 0 || args.y > 1500) throw new Error("That position is outside the wall.");

    let user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) {
      const userId = await ctx.db.insert("users", {
        authProvider: "clerk",
        externalUserId: identity.subject,
        tokenIdentifier: identity.tokenIdentifier,
        displayName: identity.name,
        email: identity.email,
        avatarUrl: identity.pictureUrl,
        createdAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }
    if (!user) throw new Error("Your profile could not be created.");

    const createdAt = Date.now();
    const existingCards = await ctx.db.query("cards").withIndex("by_status_created", (q) => q.eq("status", "published")).collect();
    const zIndex = existingCards.reduce((highest, card) => Math.max(highest, card.zIndex), 0) + 1;
    const cardId = await ctx.db.insert("cards", {
      ownerId: user._id,
      name: args.name.trim(),
      category: args.category,
      line: args.line.trim(),
      area: args.area.trim(),
      price: args.price?.trim() || undefined,
      theme: args.theme,
      imageIds: args.imageIds,
      x: args.x,
      y: args.y,
      rotation: args.rotation,
      width: args.width,
      zIndex,
      status: "published",
      positionLockedAt: createdAt,
      createdAt,
    });
    const urls = await Promise.all(args.imageIds.map((imageId) => ctx.storage.getUrl(imageId)));
    return {
      id: cardId,
      ownerId: user._id,
      name: args.name.trim(),
      category: args.category,
      line: args.line.trim(),
      area: args.area.trim(),
      price: args.price?.trim() || undefined,
      theme: args.theme,
      images: urls.filter((url): url is string => url !== null),
      x: args.x,
      y: args.y,
      rotation: args.rotation,
      width: args.width,
      zIndex,
      positionLockedAt: createdAt,
      createdAt,
    };
  },
});
