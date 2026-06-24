import { expect, test, describe } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { api, internal } from "../../convex/_generated/api";
import { makeT, validCard, userIdentity, otherUserIdentity } from "./helpers";

const bundleCard = { ...validCard, paidAmount: 19.99 as const, city: "" as const, state: "" as const };

const bundleCities = [
  { country: "US", state: "WA", city: "Seattle" },
  { country: "US", state: "OR", city: "Portland" },
  { country: "US", state: "CA", city: "San Francisco" },
];

async function createBundlePending(t: ReturnType<typeof makeT>) {
  const result = await t.withIdentity(userIdentity).mutation(api.cards.create, bundleCard) as { pendingCardId: Id<"pendingCards"> };
  return result.pendingCardId;
}

// ---------------------------------------------------------------------------
// cards.create with paidAmount: 19.99 (bundle pending)
// ---------------------------------------------------------------------------

describe("create – bundle pending card", () => {
  test("returns pendingCardId and not a published card", async () => {
    const t = makeT();
    const result = await t.withIdentity(userIdentity).mutation(api.cards.create, bundleCard) as { pendingCardId: string };
    expect(result).toHaveProperty("pendingCardId");
    expect(result).not.toHaveProperty("id");
  });

  test("bundle pending card does not appear in listPublished", async () => {
    const t = makeT();
    await t.withIdentity(userIdentity).mutation(api.cards.create, bundleCard);
    const cards = await t.query(api.cards.listPublished, { country: "US", state: "WA", city: "Seattle" });
    expect(cards).toHaveLength(0);
  });

  test("does not require city to be non-empty", async () => {
    const t = makeT();
    const result = await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      paidAmount: 19.99,
      city: "",
      state: "",
    }) as { pendingCardId: string };
    expect(result).toHaveProperty("pendingCardId");
  });

  test("does not require state to be non-empty", async () => {
    const t = makeT();
    const result = await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      paidAmount: 19.99,
      city: "Anywhere",
      state: "",
    }) as { pendingCardId: string };
    expect(result).toHaveProperty("pendingCardId");
  });

  test("still requires country to be non-empty", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, {
        ...validCard,
        paidAmount: 19.99,
        city: "",
        state: "",
        country: "",
      }),
    ).rejects.toThrow("Country must be specified");
  });

  test("still requires valid name", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...bundleCard, name: "X" }),
    ).rejects.toThrow("Business name must be between 2 and 60 characters");
  });

  test("still requires valid line", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...bundleCard, line: "Hi" }),
    ).rejects.toThrow("Service description must be between 5 and 90 characters");
  });

  test("still requires at least one contact method", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, {
        ...bundleCard,
        phone: undefined,
        email: undefined,
      }),
    ).rejects.toThrow("Add at least one contact method");
  });
});

// ---------------------------------------------------------------------------
// completeBundlePosting
// ---------------------------------------------------------------------------

describe("completeBundlePosting", () => {
  test("creates one published card per city in bundleCities", async () => {
    const t = makeT();
    const pendingCardId = await createBundlePending(t);
    const cards = await t.mutation(internal.paymentsInternal.completeBundlePosting, {
      pendingCardId,
      sessionId: "sess_test_123",
      paidAmount: 19.99,
      tokenIdentifier: userIdentity.tokenIdentifier,
      bundleCities,
    }) as Array<{ id: Id<"cards"> }>;
    expect(cards).toHaveLength(3);
  });

  test("created cards appear in listPublished for their respective city", async () => {
    const t = makeT();
    const pendingCardId = await createBundlePending(t);
    await t.mutation(internal.paymentsInternal.completeBundlePosting, {
      pendingCardId,
      sessionId: "sess_test_456",
      paidAmount: 19.99,
      tokenIdentifier: userIdentity.tokenIdentifier,
      bundleCities,
    });
    const seattleCards = await t.query(api.cards.listPublished, { country: "US", state: "WA", city: "Seattle" });
    const portlandCards = await t.query(api.cards.listPublished, { country: "US", state: "OR", city: "Portland" });
    const sfCards = await t.query(api.cards.listPublished, { country: "US", state: "CA", city: "San Francisco" });
    expect(seattleCards.length).toBe(1);
    expect(portlandCards.length).toBe(1);
    expect(sfCards.length).toBe(1);
    expect(seattleCards[0].name).toBe(validCard.name);
  });

  test("is idempotent — calling again with same sessionId returns the first card without duplicating", async () => {
    const t = makeT();
    const pendingCardId = await createBundlePending(t);
    const args = {
      pendingCardId,
      sessionId: "sess_idempotent",
      paidAmount: 19.99,
      tokenIdentifier: userIdentity.tokenIdentifier,
      bundleCities,
    };
    const first = await t.mutation(internal.paymentsInternal.completeBundlePosting, args) as Array<{ id: Id<"cards"> }>;
    const second = await t.mutation(internal.paymentsInternal.completeBundlePosting, args) as Array<{ id: Id<"cards"> }>;
    expect(second[0].id).toEqual(first[0].id);
    const allPublished = await t.query(api.cards.listPublished, { country: "US", state: "WA", city: "Seattle" });
    expect(allPublished).toHaveLength(1);
  });

  test("fails if paidAmount does not match the pending card's paidAmount", async () => {
    const t = makeT();
    const pendingCardId = await createBundlePending(t);
    await expect(
      t.mutation(internal.paymentsInternal.completeBundlePosting, {
        pendingCardId,
        sessionId: "sess_mismatch",
        paidAmount: 9.99,
        tokenIdentifier: userIdentity.tokenIdentifier,
        bundleCities,
      }),
    ).rejects.toThrow("payment does not match");
  });

  test("fails if the pending card belongs to a different user", async () => {
    const t = makeT();
    const pendingCardId = await createBundlePending(t);
    await expect(
      t.mutation(internal.paymentsInternal.completeBundlePosting, {
        pendingCardId,
        sessionId: "sess_wrong_owner",
        paidAmount: 19.99,
        tokenIdentifier: otherUserIdentity.tokenIdentifier,
        bundleCities,
      }),
    ).rejects.toThrow("You can only complete your own card");
  });
});
