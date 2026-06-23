import { expect, test, describe } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { api, internal } from "../../convex/_generated/api";
import {
  makeT,
  validCard,
  userIdentity,
  otherUserIdentity,
} from "./helpers";

// Helper: create a free card as the primary user and return its Id.
async function createFreeCard(t: ReturnType<typeof makeT>) {
  const result = await t.withIdentity(userIdentity).mutation(api.cards.create, validCard) as { id: Id<"cards"> };
  return result.id;
}

// Helper: ensure a user record exists for an identity (needed before ownership checks).
async function seedUser(t: ReturnType<typeof makeT>, identity: typeof userIdentity) {
  await t.withIdentity(identity).mutation(api.cards.create, { ...validCard, name: "Seed card identity" });
}

// ---------------------------------------------------------------------------
// Auth guards
// ---------------------------------------------------------------------------

describe("create – auth guards", () => {
  test("unauthenticated call throws", async () => {
    const t = makeT();
    await expect(t.mutation(api.cards.create, validCard)).rejects.toThrow(
      "You must sign in to post a card.",
    );
  });

  test("blocked user cannot create a card", async () => {
    const t = makeT();
    const asUser = t.withIdentity(userIdentity);
    await asUser.mutation(api.cards.create, validCard);

    await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", userIdentity.tokenIdentifier),
        )
        .unique();
      if (user) await ctx.db.patch(user._id, { blockedAt: Date.now(), blockedReason: "test block" });
    });

    await expect(asUser.mutation(api.cards.create, validCard)).rejects.toThrow("blocked");
  });
});

// ---------------------------------------------------------------------------
// Free-card creation (paidAmount = 0)
// ---------------------------------------------------------------------------

describe("create – free card", () => {
  test("publishes immediately and returns id", async () => {
    const t = makeT();
    const result = await t.withIdentity(userIdentity).mutation(api.cards.create, validCard) as { id: string };
    expect(result).toHaveProperty("id");
    expect(result).not.toHaveProperty("pendingCardId");

    const cards = await t.query(api.cards.listPublished, { country: "US", state: "WA", city: "Seattle" });
    expect(cards.some((c) => c.name === validCard.name)).toBe(true);
  });

  test("card appears in listMine", async () => {
    const t = makeT();
    const asUser = t.withIdentity(userIdentity);
    await asUser.mutation(api.cards.create, validCard);
    const mine = await asUser.query(api.cards.listMine, {});
    expect(mine.length).toBe(1);
    expect(mine[0].name).toBe(validCard.name);
  });

  test("auto-creates user record on first mutation", async () => {
    const t = makeT();
    await t.withIdentity(userIdentity).mutation(api.cards.create, validCard);
    const profile = await t.withIdentity(userIdentity).query(api.cards.getMyProfile, {});
    expect(profile).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Paid-card creation (paidAmount > 0)
// ---------------------------------------------------------------------------

describe("create – paid card", () => {
  test("creates a pendingCard and returns pendingCardId", async () => {
    const t = makeT();
    const result = await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      paidAmount: 2.99,
    }) as { pendingCardId: string };
    expect(result).toHaveProperty("pendingCardId");
    expect(result).not.toHaveProperty("id");
  });

  test("paid card is not yet visible on the wall", async () => {
    const t = makeT();
    await t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, paidAmount: 7.99 });
    const cards = await t.query(api.cards.listPublished, { country: "US", state: "WA", city: "Seattle" });
    expect(cards.length).toBe(0);
  });

  test("invalid paidAmount throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, paidAmount: 1.99 }),
    ).rejects.toThrow("Invalid payment option");
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("create – field validation", () => {
  test("name too short throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, name: "X" }),
    ).rejects.toThrow("Business name must be between 2 and 60 characters");
  });

  test("name too long throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, name: "A".repeat(61) }),
    ).rejects.toThrow("Business name must be between 2 and 60 characters");
  });

  test("line too short throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, line: "Hi" }),
    ).rejects.toThrow("Service description must be between 5 and 90 characters");
  });

  test("no phone or email throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, {
        ...validCard,
        phone: undefined,
        email: undefined,
      }),
    ).rejects.toThrow("Add at least one contact method");
  });

  test("blocked text in name throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, name: "nude services available" }),
    ).rejects.toThrow("not allowed on WALL");
  });

  test("invalid zip code throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, zipcode: "!!!!" }),
    ).rejects.toThrow("zip code");
  });

  test("invalid email throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, {
        ...validCard,
        phone: undefined,
        email: "not-an-email",
      }),
    ).rejects.toThrow("valid email");
  });

  test("out-of-bounds x/y throws", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, { ...validCard, x: -1 }),
    ).rejects.toThrow("outside the wall");
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe("update", () => {
  test("owner can update their card", async () => {
    const t = makeT();
    const asUser = t.withIdentity(userIdentity);
    const id = await createFreeCard(t);
    await asUser.mutation(api.cards.update, {
      cardId: id,
      name: "Bob's Updated Plumbing",
      category: "Services",
      line: "Same great service, new name",
      area: "Uptown",
      phone: "+1 206 555 9999",
      theme: "paper",
    });
    const mine = await asUser.query(api.cards.listMine, {});
    expect(mine[0].name).toBe("Bob's Updated Plumbing");
  });

  test("non-owner cannot update card", async () => {
    const t = makeT();
    const id = await createFreeCard(t);
    await seedUser(t, otherUserIdentity);
    await expect(
      t.withIdentity(otherUserIdentity).mutation(api.cards.update, {
        cardId: id,
        name: "Hijacked Name",
        category: "Services",
        line: "Unauthorized update attempt",
        area: "Nowhere",
        phone: "+1 555 000 0000",
        theme: "yellow",
      }),
    ).rejects.toThrow("You can only edit your own cards");
  });
});

// ---------------------------------------------------------------------------
// setVisibility
// ---------------------------------------------------------------------------

describe("setVisibility", () => {
  test("owner can hide and republish their card", async () => {
    const t = makeT();
    const asUser = t.withIdentity(userIdentity);
    const id = await createFreeCard(t);

    await asUser.mutation(api.cards.setVisibility, { cardId: id, status: "hidden" });
    expect((await asUser.query(api.cards.listMine, {}))[0].status).toBe("hidden");

    await asUser.mutation(api.cards.setVisibility, { cardId: id, status: "published" });
    expect((await asUser.query(api.cards.listMine, {}))[0].status).toBe("published");
  });

  test("non-owner cannot change visibility", async () => {
    const t = makeT();
    const id = await createFreeCard(t);
    await seedUser(t, otherUserIdentity);
    await expect(
      t.withIdentity(otherUserIdentity).mutation(api.cards.setVisibility, { cardId: id, status: "hidden" }),
    ).rejects.toThrow("You can only manage your own cards");
  });

  test("expired card cannot be republished", async () => {
    const t = makeT();
    const id = await createFreeCard(t);
    await t.run(async (ctx) => {
      await ctx.db.patch(id, { expiresAt: Date.now() - 1000 });
    });
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.setVisibility, { cardId: id, status: "published" }),
    ).rejects.toThrow("Expired cards must be renewed");
  });
});

// ---------------------------------------------------------------------------
// renew (free only — paid renewals go through Stripe)
// ---------------------------------------------------------------------------

describe("renew", () => {
  test("free renewal extends expiry", async () => {
    const t = makeT();
    const asUser = t.withIdentity(userIdentity);
    const id = await createFreeCard(t);
    const before = (await asUser.query(api.cards.listMine, {}))[0].expiresAt;
    await asUser.mutation(api.cards.renew, { cardId: id, paidAmount: 0 });
    const after = (await asUser.query(api.cards.listMine, {}))[0].expiresAt;
    expect(after).toBeGreaterThan(before);
  });

  test("paid renewal via this mutation throws (must use Stripe)", async () => {
    const t = makeT();
    const id = await createFreeCard(t);
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.renew, { cardId: id, paidAmount: 2.99 }),
    ).rejects.toThrow("Paid renewals must be completed through verified checkout");
  });

  test("non-owner cannot renew", async () => {
    const t = makeT();
    const id = await createFreeCard(t);
    await seedUser(t, otherUserIdentity);
    await expect(
      t.withIdentity(otherUserIdentity).mutation(api.cards.renew, { cardId: id, paidAmount: 0 }),
    ).rejects.toThrow("You can only renew your own cards");
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

describe("remove", () => {
  test("owner can delete their card", async () => {
    const t = makeT();
    const asUser = t.withIdentity(userIdentity);
    const id = await createFreeCard(t);
    await asUser.mutation(api.cards.remove, { cardId: id });
    expect((await asUser.query(api.cards.listMine, {})).length).toBe(0);
  });

  test("non-owner cannot delete card", async () => {
    const t = makeT();
    const id = await createFreeCard(t);
    await seedUser(t, otherUserIdentity);
    await expect(
      t.withIdentity(otherUserIdentity).mutation(api.cards.remove, { cardId: id }),
    ).rejects.toThrow("You can only delete your own cards");
  });
});

// ---------------------------------------------------------------------------
// markExpired (internal cron)
// ---------------------------------------------------------------------------

describe("markExpired", () => {
  test("marks published cards past their expiresAt as expired", async () => {
    const t = makeT();
    const id = await createFreeCard(t);

    await t.run(async (ctx) => {
      await ctx.db.patch(id, { expiresAt: Date.now() - 1000 });
    });
    await t.mutation(internal.cards.markExpired, {});

    const mine = await t.withIdentity(userIdentity).query(api.cards.listMine, {});
    expect(mine[0].status).toBe("expired");
  });
});

// ---------------------------------------------------------------------------
// completePaidCard (payment idempotency)
// ---------------------------------------------------------------------------

describe("completePaidCard", () => {
  test("completing the same sessionId twice is idempotent", async () => {
    const t = makeT();
    const { pendingCardId } = await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      paidAmount: 2.99,
    }) as { pendingCardId: Id<"pendingCards"> };

    const args = {
      pendingCardId,
      sessionId: "cs_test_idempotency",
      paidAmount: 2.99,
      tokenIdentifier: userIdentity.tokenIdentifier,
    };
    const first = await t.mutation(internal.paymentsInternal.completePaidCard, args) as { id: Id<"cards"> };
    const second = await t.mutation(internal.paymentsInternal.completePaidCard, args) as { id: Id<"cards"> };

    expect(first.id).toEqual(second.id);
    expect((await t.withIdentity(userIdentity).query(api.cards.listMine, {})).length).toBe(1);
  });

  test("expired pendingCard throws", async () => {
    const t = makeT();
    const { pendingCardId } = await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      paidAmount: 2.99,
    }) as { pendingCardId: Id<"pendingCards"> };

    await t.run(async (ctx) => {
      await ctx.db.patch(pendingCardId, { expiresAt: Date.now() - 1000 });
    });

    await expect(
      t.mutation(internal.paymentsInternal.completePaidCard, {
        pendingCardId,
        sessionId: "cs_test_expired",
        paidAmount: 2.99,
        tokenIdentifier: userIdentity.tokenIdentifier,
      }),
    ).rejects.toThrow("no longer available");
  });

  test("wrong token identifier throws", async () => {
    const t = makeT();
    const { pendingCardId } = await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      paidAmount: 2.99,
    }) as { pendingCardId: Id<"pendingCards"> };

    await expect(
      t.mutation(internal.paymentsInternal.completePaidCard, {
        pendingCardId,
        sessionId: "cs_test_wrong_owner",
        paidAmount: 2.99,
        tokenIdentifier: otherUserIdentity.tokenIdentifier,
      }),
    ).rejects.toThrow("You can only complete your own card");
  });
});
