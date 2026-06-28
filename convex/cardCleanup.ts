import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export async function deleteCardOwnedData(ctx: MutationCtx, cardId: Id<"cards">) {
  const [reviews, savedCards, cardLikes, stats, dailyStats] = await Promise.all([
    ctx.db.query("reviews").withIndex("by_card_and_createdAt", (q) => q.eq("cardId", cardId)).collect(),
    ctx.db.query("savedCards").withIndex("by_cardId", (q) => q.eq("cardId", cardId)).collect(),
    ctx.db.query("cardLikes").withIndex("by_card", (q) => q.eq("cardId", cardId)).collect(),
    ctx.db.query("cardStats").withIndex("by_card", (q) => q.eq("cardId", cardId)).unique(),
    ctx.db.query("dailyCardStats").withIndex("by_card_and_date", (q) => q.eq("cardId", cardId)).collect(),
  ]);

  await Promise.all([
    ...reviews.map((review) => ctx.db.delete(review._id)),
    ...savedCards.map((savedCard) => ctx.db.delete(savedCard._id)),
    ...cardLikes.map((like) => ctx.db.delete(like._id)),
    ...dailyStats.map((stat) => ctx.db.delete(stat._id)),
    ...(stats ? [ctx.db.delete(stats._id)] : []),
  ]);
}
