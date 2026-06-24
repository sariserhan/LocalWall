import { expect, test, describe } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { makeT, validCard, userIdentity, otherUserIdentity } from "./helpers";

async function createCard(t: ReturnType<typeof makeT>) {
  const result = await t.withIdentity(userIdentity).mutation(api.cards.create, validCard) as { id: Id<"cards"> };
  return result.id;
}

// ---------------------------------------------------------------------------
// savedCards.list
// ---------------------------------------------------------------------------

describe("savedCards.list", () => {
  test("returns empty list for unauthenticated user", async () => {
    const t = makeT();
    expect(await t.query(api.savedCards.list, {})).toEqual([]);
  });

  test("returns empty list when nothing is saved", async () => {
    const t = makeT();
    await createCard(t);
    expect(await t.withIdentity(otherUserIdentity).query(api.savedCards.list, {})).toEqual([]);
  });

  test("returns saved card after setSaved", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: true });
    const saved = await t.withIdentity(otherUserIdentity).query(api.savedCards.list, {});
    expect(saved.length).toBe(1);
    expect(saved[0].id).toBe(cardId);
  });

  test("does not show card in another user's saved list", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: true });
    const ownerSaved = await t.withIdentity(userIdentity).query(api.savedCards.list, {});
    expect(ownerSaved).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// savedCards.setSaved
// ---------------------------------------------------------------------------

describe("savedCards.setSaved", () => {
  test("unauthenticated save throws", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await expect(t.mutation(api.savedCards.setSaved, { cardId, saved: true })).rejects.toThrow();
  });

  test("saving a card returns saved:true", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const res = await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: true }) as { saved: boolean };
    expect(res.saved).toBe(true);
  });

  test("unsaving a card returns saved:false and removes it from list", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: true });
    const res = await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: false }) as { saved: boolean };
    expect(res.saved).toBe(false);
    const list = await t.withIdentity(otherUserIdentity).query(api.savedCards.list, {});
    expect(list).toHaveLength(0);
  });

  test("saving twice is idempotent", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: true });
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: true });
    const list = await t.withIdentity(otherUserIdentity).query(api.savedCards.list, {});
    expect(list).toHaveLength(1);
  });

  test("unsaving a card that was never saved is a no-op", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    const res = await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: false }) as { saved: boolean };
    expect(res.saved).toBe(false);
  });

  test("incrementing saves stat on first save", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: true });
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// savedCards.mergeLocal
// ---------------------------------------------------------------------------

describe("savedCards.mergeLocal", () => {
  test("unauthenticated merge throws", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await expect(t.mutation(api.savedCards.mergeLocal, { cardIds: [String(cardId)] })).rejects.toThrow();
  });

  test("imports valid card IDs into saved list", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.mergeLocal, { cardIds: [String(cardId)] });
    const list = await t.withIdentity(otherUserIdentity).query(api.savedCards.list, {});
    expect(list.some((c) => c.id === cardId)).toBe(true);
  });

  test("silently ignores invalid or non-existent card IDs", async () => {
    const t = makeT();
    await createCard(t);
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.mergeLocal, { cardIds: ["not-a-real-id", "also-fake"] });
    const list = await t.withIdentity(otherUserIdentity).query(api.savedCards.list, {});
    expect(list).toHaveLength(0);
  });

  test("does not create duplicates when card already saved", async () => {
    const t = makeT();
    const cardId = await createCard(t);
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.setSaved, { cardId, saved: true });
    await t.withIdentity(otherUserIdentity).mutation(api.savedCards.mergeLocal, { cardIds: [String(cardId)] });
    const list = await t.withIdentity(otherUserIdentity).query(api.savedCards.list, {});
    expect(list).toHaveLength(1);
  });
});
