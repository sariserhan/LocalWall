import { expect, test, describe } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { makeT, validCard, userIdentity, otherUserIdentity, seedUser } from "./helpers";

async function createCard(t: ReturnType<typeof makeT>, overrides: Record<string, unknown> = {}) {
  const result = await t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, ...overrides }) as { id: Id<"cards"> };
  return result.id;
}

// ---------------------------------------------------------------------------
// getLiveViewCounts
// ---------------------------------------------------------------------------

describe("getLiveViewCounts", () => {
  test("returns zero clicks and likes for a brand-new card", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts).toHaveLength(1);
    expect(counts[0].id).toBe(cardId);
    expect(counts[0].clicks).toBe(0);
    expect(counts[0].likes).toBe(0);
  });

  test("handles an empty ID array without throwing", async () => {
    const t = makeT();
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [] });
    expect(counts).toEqual([]);
  });

  test("handles multiple card IDs and returns one entry each", async () => {
    const t = makeT();
    const ids = await Promise.all([
      createCard(t, { name: "Alpha Co" }),
      createCard(t, { name: "Beta Co" }),
      createCard(t, { name: "Gamma Co" }),
    ]);
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: ids });
    expect(counts).toHaveLength(3);
    const returnedIds = counts.map((c) => c.id);
    for (const id of ids) expect(returnedIds).toContain(id);
  });

  test("reflects updated click count after incrementClicks", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.mutation(api.cards.incrementClicks, { cardId });
    await t.mutation(api.cards.incrementClicks, { cardId });
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0].clicks).toBe(2);
  });

  test("reflects updated like count after toggleLike", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await seedUser(t, otherUserIdentity);
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0].likes).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// incrementClicks
// ---------------------------------------------------------------------------

describe("incrementClicks", () => {
  test("increments by 1 on first click", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const result = await t.mutation(api.cards.incrementClicks, { cardId }) as { incremented: boolean; clicks: number };
    expect(result.incremented).toBe(true);
    expect(result.clicks).toBe(1);
  });

  test("accumulates across multiple clicks", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    for (let i = 0; i < 5; i++) await t.mutation(api.cards.incrementClicks, { cardId });
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0].clicks).toBe(5);
  });

  test("owner clicks on their own card are not counted", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const result = await t.withIdentity(userIdentity).mutation(api.cards.incrementClicks, { cardId }) as { incremented: boolean };
    expect(result.incremented).toBe(false);
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0].clicks).toBe(0);
  });

  test("throws when card does not exist", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(userIdentity).mutation(api.cards.remove, { cardId });
    await expect(t.mutation(api.cards.incrementClicks, { cardId })).rejects.toThrow("Card not found");
  });
});

// ---------------------------------------------------------------------------
// recordEvent
// ---------------------------------------------------------------------------

describe("recordEvent", () => {
  test("records a website click event", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const result = await t.mutation(api.cards.recordEvent, { cardId, event: "website" }) as { success: boolean };
    expect(result.success).toBe(true);
  });

  test("records all supported event types without throwing", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const events = ["website", "phone", "email", "social", "save", "share"] as const;
    for (const event of events) {
      const result = await t.mutation(api.cards.recordEvent, { cardId, event }) as { success: boolean };
      expect(result.success).toBe(true);
    }
  });

  test("throws on unknown card", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(userIdentity).mutation(api.cards.remove, { cardId });
    await expect(t.mutation(api.cards.recordEvent, { cardId, event: "phone" })).rejects.toThrow("Card not found");
  });
});

// ---------------------------------------------------------------------------
// toggleLike / getLikedCards
// ---------------------------------------------------------------------------

describe("toggleLike", () => {
  test("unauthenticated like throws", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await expect(t.mutation(api.cards.toggleLike, { cardId })).rejects.toThrow("Sign in");
  });

  test("like returns liked:true and increments count", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await seedUser(t, otherUserIdentity);
    const res = await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId }) as { liked: boolean };
    expect(res.liked).toBe(true);
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0].likes).toBe(1);
  });

  test("second toggle unlikes and decrements count", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await seedUser(t, otherUserIdentity);
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    const res = await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId }) as { liked: boolean };
    expect(res.liked).toBe(false);
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0].likes).toBe(0);
  });

  test("like count does not go below zero on double-unlike", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await seedUser(t, otherUserIdentity);
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0].likes).toBeGreaterThanOrEqual(0);
  });
});

describe("getLikedCards", () => {
  test("returns empty array for unauthenticated user", async () => {
    const t = makeT();
    expect(await t.query(api.cards.getLikedCards, {})).toEqual([]);
  });

  test("returns card IDs the user has liked", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await seedUser(t, otherUserIdentity);
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    const liked = await t.withIdentity(otherUserIdentity).query(api.cards.getLikedCards, {});
    expect(liked).toContain(cardId);
  });

  test("does not include unliked cards", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await seedUser(t, otherUserIdentity);
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    const liked = await t.withIdentity(otherUserIdentity).query(api.cards.getLikedCards, {});
    expect(liked).not.toContain(cardId);
  });

  test("only returns the current user's likes, not other users", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await seedUser(t, otherUserIdentity);
    await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId });
    const likedByOwner = await t.withIdentity(userIdentity).query(api.cards.getLikedCards, {});
    expect(likedByOwner).not.toContain(cardId);
  });
});

// ---------------------------------------------------------------------------
// updatePosition
// ---------------------------------------------------------------------------

describe("updatePosition", () => {
  test("owner can reposition their card", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const result = await t.withIdentity(userIdentity).mutation(api.cards.updatePosition, { cardId, x: 42, y: 300 }) as { x: number; y: number };
    expect(result.x).toBe(42);
    expect(result.y).toBe(300);
  });

  test("non-owner cannot move the card", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await seedUser(t, otherUserIdentity);
    await expect(t.withIdentity(otherUserIdentity).mutation(api.cards.updatePosition, { cardId, x: 10, y: 100 })).rejects.toThrow("own");
  });

  test("unauthenticated move is rejected", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await expect(t.mutation(api.cards.updatePosition, { cardId, x: 10, y: 100 })).rejects.toThrow();
  });

  test("x is clamped to 0–100", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const result = await t.withIdentity(userIdentity).mutation(api.cards.updatePosition, { cardId, x: 200, y: 100 }) as { x: number };
    expect(result.x).toBe(100);
  });
});
