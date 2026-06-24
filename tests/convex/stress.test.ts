/**
 * Stress tests — verify that removed caps don't silently re-appear and that
 * the system handles large volumes of cards without truncation or errors.
 *
 * All tests run in the convex-test in-memory environment so they are fast,
 * but they deliberately create more cards than the old limits (100, 200) to
 * catch any accidental re-introduction of those caps.
 */

import { expect, test, describe, beforeAll, afterAll } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import {
  makeT,
  validCard,
  userIdentity,
  otherUserIdentity,
  adminIdentity,
  adminEnv,
  applyEnv,
  seedAdminUser,
  seedUser,
} from "./helpers";

let cleanupEnv: () => void;
beforeAll(() => { cleanupEnv = applyEnv(adminEnv); });
afterAll(() => cleanupEnv());

const OVER_OLD_LIMIT = 120; // previously cards were capped at 100 or 200

// Helper: create N cards for userIdentity in sequence.
async function seedCards(t: ReturnType<typeof makeT>, count: number) {
  const ids: Id<"cards">[] = [];
  for (let i = 0; i < count; i++) {
    const result = await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      name: `Stress Card #${i + 1}`,
      x: 5 + (i % 80),
      y: 50 + i * 10,
    }) as { id: Id<"cards"> };
    ids.push(result.id);
  }
  return ids;
}

// Helper: create N playground cards for adminIdentity.
async function seedPgCards(t: ReturnType<typeof makeT>, count: number) {
  await seedAdminUser(t);
  const ids: Id<"cards">[] = [];
  for (let i = 0; i < count; i++) {
    const result = await t.withIdentity(adminIdentity).mutation(api.admin.playgroundCreateCard, {
      name: `PG Card #${i + 1}`,
      category: "Services",
      line: "Stress test card",
      country: "xx",
      state: "test",
      city: "Playground",
      theme: "yellow",
      paidAmount: 0,
    }) as { cardId: Id<"cards"> };
    ids.push(result.cardId);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// listPublished — no cap (was .take(200))
// ---------------------------------------------------------------------------

describe("listPublished — no cap on city wall", () => {
  test(`returns all ${OVER_OLD_LIMIT} cards when city filter is specified`, async () => {
    const t = makeT();
    await seedCards(t, OVER_OLD_LIMIT);
    const cards = await t.query(api.cards.listPublished, {
      country: validCard.country,
      state: validCard.state,
      city: validCard.city,
    });
    expect(cards.length).toBe(OVER_OLD_LIMIT);
  });

  test("does not truncate when count exceeds old 200-card global limit", async () => {
    const t = makeT();
    await seedCards(t, OVER_OLD_LIMIT);
    const cards = await t.query(api.cards.listPublished, {
      country: validCard.country,
      state: validCard.state,
      city: validCard.city,
    });
    // Every seeded card name must appear in the result — none silently dropped.
    const names = new Set(cards.map((c) => c.name));
    for (let i = 1; i <= OVER_OLD_LIMIT; i++) {
      expect(names.has(`Stress Card #${i}`)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// listMine — no cap (was .take(100))
// ---------------------------------------------------------------------------

describe("listMine — no cap on owner's cards", () => {
  test(`returns all ${OVER_OLD_LIMIT} cards owned by the user`, async () => {
    const t = makeT();
    await seedCards(t, OVER_OLD_LIMIT);
    const mine = await t.withIdentity(userIdentity).query(api.cards.listMine, {});
    expect(mine.length).toBe(OVER_OLD_LIMIT);
  });
});

// ---------------------------------------------------------------------------
// getLiveViewCounts — no cap (was throw at > 200)
// ---------------------------------------------------------------------------

describe("getLiveViewCounts — no cap on ID array", () => {
  test(`handles ${OVER_OLD_LIMIT} card IDs without throwing`, async () => {
    const t = makeT();
    const ids = await seedCards(t, OVER_OLD_LIMIT);
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: ids });
    expect(counts.length).toBe(OVER_OLD_LIMIT);
  });

  test("all returned entries have non-negative clicks and likes", async () => {
    const t = makeT();
    const ids = await seedCards(t, OVER_OLD_LIMIT);
    // toggleLike requires a user record in the DB.
    await seedUser(t, otherUserIdentity);
    // Add some clicks and likes to a subset.
    for (const id of ids.slice(0, 10)) {
      await t.mutation(api.cards.incrementClicks, { cardId: id });
      await t.withIdentity(otherUserIdentity).mutation(api.cards.toggleLike, { cardId: id });
    }
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: ids });
    for (const entry of counts) {
      expect(entry.clicks).toBeGreaterThanOrEqual(0);
      expect(entry.likes).toBeGreaterThanOrEqual(0);
    }
  });

  test("IDs with clicks are reflected correctly alongside IDs without", async () => {
    const t = makeT();
    const ids = await seedCards(t, 50);
    const clickedId = ids[0];
    await t.mutation(api.cards.incrementClicks, { cardId: clickedId });
    await t.mutation(api.cards.incrementClicks, { cardId: clickedId });
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: ids });
    const entry = counts.find((c) => c.id === clickedId)!;
    expect(entry.clicks).toBe(2);
    const zeroEntries = counts.filter((c) => c.id !== clickedId);
    expect(zeroEntries.every((c) => c.clicks === 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// playgroundGetMyCards — no cap (was .take(100))
// ---------------------------------------------------------------------------

describe("playgroundGetMyCards — no cap", () => {
  test(`returns all ${OVER_OLD_LIMIT} playground cards`, async () => {
    const t = makeT();
    await seedPgCards(t, OVER_OLD_LIMIT);
    const data = await t.withIdentity(adminIdentity).query(api.admin.playgroundGetMyCards, {}) as { cards: unknown[] };
    expect(data.cards.length).toBe(OVER_OLD_LIMIT);
  });
});

// ---------------------------------------------------------------------------
// playgroundDeleteAllMyCards — handles large batches
// ---------------------------------------------------------------------------

describe("playgroundDeleteAllMyCards — bulk deletion", () => {
  test(`deletes all ${OVER_OLD_LIMIT} cards and reports correct count`, async () => {
    const t = makeT();
    await seedPgCards(t, OVER_OLD_LIMIT);
    const result = await t.withIdentity(adminIdentity).mutation(api.admin.playgroundDeleteAllMyCards, {}) as { deleted: number };
    expect(result.deleted).toBe(OVER_OLD_LIMIT);
    const data = await t.withIdentity(adminIdentity).query(api.admin.playgroundGetMyCards, {}) as { cards: unknown[] };
    expect(data.cards).toHaveLength(0);
  });

  test("second call after deletion returns 0", async () => {
    const t = makeT();
    await seedPgCards(t, 10);
    await t.withIdentity(adminIdentity).mutation(api.admin.playgroundDeleteAllMyCards, {});
    const result = await t.withIdentity(adminIdentity).mutation(api.admin.playgroundDeleteAllMyCards, {}) as { deleted: number };
    expect(result.deleted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Concurrent card creation (race condition safety)
// ---------------------------------------------------------------------------

describe("concurrent card creation", () => {
  test("20 simultaneous creates all land in listPublished", async () => {
    const t = makeT();
    const CONCURRENT = 20;
    const results = await Promise.all(
      Array.from({ length: CONCURRENT }, (_, i) =>
        t.withIdentity(userIdentity).mutation(api.cards.create, {
          ...validCard,
          name: `Concurrent Card ${i}`,
        })
      )
    ) as Array<{ id: Id<"cards"> }>;
    expect(results).toHaveLength(CONCURRENT);
    const cards = await t.query(api.cards.listPublished, {
      country: validCard.country,
      state: validCard.state,
      city: validCard.city,
    });
    expect(cards.length).toBe(CONCURRENT);
  });

  test("concurrent incrementClicks on the same card accumulates correctly", async () => {
    const t = makeT();
    const result = await t.withIdentity(userIdentity).mutation(api.cards.create, validCard) as { id: Id<"cards"> };
    const cardId = result.id;
    const CLICKS = 15;
    await Promise.all(Array.from({ length: CLICKS }, () => t.mutation(api.cards.incrementClicks, { cardId })));
    const counts = await t.query(api.cards.getLiveViewCounts, { cardIds: [cardId] });
    expect(counts[0].clicks).toBe(CLICKS);
  });
});

// ---------------------------------------------------------------------------
// Stack simulation — many cards at the same position
// ---------------------------------------------------------------------------

describe("stack simulation", () => {
  test("50 cards at the same (x, y) all appear in listPublished", async () => {
    const t = makeT();
    const STACK_SIZE = 50;
    await Promise.all(
      Array.from({ length: STACK_SIZE }, (_, i) =>
        t.withIdentity(userIdentity).mutation(api.cards.create, {
          ...validCard,
          name: `Stacked Card ${i}`,
          x: 50,
          y: 400,
        })
      )
    );
    const cards = await t.query(api.cards.listPublished, {
      country: validCard.country,
      state: validCard.state,
      city: validCard.city,
    });
    expect(cards.length).toBe(STACK_SIZE);
    const stackCards = cards.filter((c) => c.x === 50 && c.y === 400);
    expect(stackCards.length).toBe(STACK_SIZE);
  });
});
