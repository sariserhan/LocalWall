import { expect, test, describe } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { api, internal } from "../../convex/_generated/api";
import { makeT, validCard, userIdentity } from "./helpers";

// ---------------------------------------------------------------------------
// subscribe
// ---------------------------------------------------------------------------

describe("subscribe", () => {
  test("valid subscription inserts and returns alreadySubscribed: false", async () => {
    const t = makeT();
    const result = await t.mutation(api.digest.subscribe, {
      email: "hello@example.com",
      country: "US",
      state: "WA",
      city: "Seattle",
    });
    expect(result).toEqual({ alreadySubscribed: false });
  });

  test("same email + same city returns alreadySubscribed: true", async () => {
    const t = makeT();
    const args = { email: "hello@example.com", country: "US", state: "WA", city: "Seattle" };
    await t.mutation(api.digest.subscribe, args);
    const result = await t.mutation(api.digest.subscribe, args);
    expect(result).toEqual({ alreadySubscribed: true });
  });

  test("invalid email throws", async () => {
    const t = makeT();
    await expect(
      t.mutation(api.digest.subscribe, { email: "not-an-email", country: "US", state: "WA", city: "Seattle" }),
    ).rejects.toThrow("Invalid email address");
  });

  test("empty city throws", async () => {
    const t = makeT();
    await expect(
      t.mutation(api.digest.subscribe, { email: "hello@example.com", country: "US", state: "WA", city: "" }),
    ).rejects.toThrow("City is required");
  });

  test("same email in different city creates a second subscription", async () => {
    const t = makeT();
    const email = "hello@example.com";
    await t.mutation(api.digest.subscribe, { email, country: "US", state: "WA", city: "Seattle" });
    const result = await t.mutation(api.digest.subscribe, { email, country: "US", state: "WA", city: "Portland" });
    expect(result).toEqual({ alreadySubscribed: false });
  });
});

// ---------------------------------------------------------------------------
// unsubscribeByToken
// ---------------------------------------------------------------------------

describe("unsubscribeByToken", () => {
  test("valid token deletes subscription and returns { success: true }", async () => {
    const t = makeT();
    await t.mutation(api.digest.subscribe, {
      email: "hello@example.com",
      country: "US",
      state: "WA",
      city: "Seattle",
    });
    const sub = await t.run(async (ctx) => {
      return ctx.db.query("digestSubscriptions").withIndex("by_email", (q) => q.eq("email", "hello@example.com")).unique();
    });
    const result = await t.mutation(api.digest.unsubscribeByToken, { token: sub!.unsubscribeToken });
    expect(result).toEqual({ success: true });
    const gone = await t.run(async (ctx) => {
      return ctx.db.query("digestSubscriptions").withIndex("by_email", (q) => q.eq("email", "hello@example.com")).unique();
    });
    expect(gone).toBeNull();
  });

  test("unknown token returns { success: false }", async () => {
    const t = makeT();
    const result = await t.mutation(api.digest.unsubscribeByToken, { token: "doesnotexist" });
    expect(result).toEqual({ success: false });
  });
});

// ---------------------------------------------------------------------------
// findCitiesWithSubscribers
// ---------------------------------------------------------------------------

describe("findCitiesWithSubscribers", () => {
  test("returns empty array when no subscriptions", async () => {
    const t = makeT();
    const result = await t.query(internal.digest.findCitiesWithSubscribers, {});
    expect(result).toEqual([]);
  });

  test("groups multiple subscribers in same city together", async () => {
    const t = makeT();
    await t.mutation(api.digest.subscribe, { email: "a@example.com", country: "US", state: "WA", city: "Seattle" });
    await t.mutation(api.digest.subscribe, { email: "b@example.com", country: "US", state: "WA", city: "Seattle" });
    const result = await t.query(internal.digest.findCitiesWithSubscribers, {});
    expect(result).toHaveLength(1);
    expect(result[0].city).toBe("Seattle");
    expect(result[0].subscribers).toHaveLength(2);
    const emails = result[0].subscribers.map((s: { email: string }) => s.email);
    expect(emails).toContain("a@example.com");
    expect(emails).toContain("b@example.com");
  });

  test("different cities appear as separate entries", async () => {
    const t = makeT();
    await t.mutation(api.digest.subscribe, { email: "a@example.com", country: "US", state: "WA", city: "Seattle" });
    await t.mutation(api.digest.subscribe, { email: "b@example.com", country: "US", state: "OR", city: "Portland" });
    const result = await t.query(internal.digest.findCitiesWithSubscribers, {});
    expect(result).toHaveLength(2);
    const cities = result.map((r: { city: string }) => r.city).sort();
    expect(cities).toEqual(["Portland", "Seattle"]);
  });
});

// ---------------------------------------------------------------------------
// markDigestSent
// ---------------------------------------------------------------------------

describe("markDigestSent", () => {
  test("patches the subscription's lastSentAt field", async () => {
    const t = makeT();
    await t.mutation(api.digest.subscribe, { email: "a@example.com", country: "US", state: "WA", city: "Seattle" });
    const sub = await t.run(async (ctx) => {
      return ctx.db.query("digestSubscriptions").withIndex("by_email", (q) => q.eq("email", "a@example.com")).unique();
    });
    const sentAt = Date.now();
    await t.mutation(internal.digest.markDigestSent, {
      subscriptionId: sub!._id as Id<"digestSubscriptions">,
      sentAt,
    });
    const updated = await t.run(async (ctx) => ctx.db.get(sub!._id));
    expect(updated!.lastSentAt).toBe(sentAt);
  });
});

// ---------------------------------------------------------------------------
// findNewCardsForCity
// ---------------------------------------------------------------------------

describe("findNewCardsForCity", () => {
  test("returns published cards created after since matching location", async () => {
    const t = makeT();
    const before = Date.now() - 1000;
    await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      city: "Seattle",
      state: "WA",
      country: "US",
    });
    const result = await t.query(internal.digest.findNewCardsForCity, {
      country: "US",
      state: "WA",
      city: "Seattle",
      since: before,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe(validCard.name);
  });

  test("excludes cards created before since", async () => {
    const t = makeT();
    await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      city: "Seattle",
      state: "WA",
      country: "US",
    });
    const future = Date.now() + 60_000;
    const result = await t.query(internal.digest.findNewCardsForCity, {
      country: "US",
      state: "WA",
      city: "Seattle",
      since: future,
    });
    expect(result).toHaveLength(0);
  });

  test("returns empty array when no matching cards", async () => {
    const t = makeT();
    const result = await t.query(internal.digest.findNewCardsForCity, {
      country: "US",
      state: "WA",
      city: "Seattle",
      since: Date.now() - 1000,
    });
    expect(result).toHaveLength(0);
  });

  test("only returns cards for the queried city", async () => {
    const t = makeT();
    const before = Date.now() - 1000;
    await t.withIdentity(userIdentity).mutation(api.cards.create, {
      ...validCard,
      city: "Portland",
      state: "OR",
      country: "US",
    });
    const result = await t.query(internal.digest.findNewCardsForCity, {
      country: "US",
      state: "WA",
      city: "Seattle",
      since: before,
    });
    expect(result).toHaveLength(0);
  });
});
