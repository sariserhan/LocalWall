import { expect, test, describe, beforeAll, afterAll } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import {
  makeT,
  validCard,
  userIdentity,
  adminIdentity,
  adminEnv,
  applyEnv,
} from "./helpers";

// Set process.env.ADMIN_EMAILS for all tests in this file (env is process.env in test env).
let cleanupEnv: () => void;
beforeAll(() => { cleanupEnv = applyEnv(adminEnv); });
afterAll(() => cleanupEnv());

// Helper: create a free card as the regular user and return its Id.
async function createCard(t: ReturnType<typeof makeT>) {
  const result = await t.withIdentity(userIdentity).mutation(api.cards.create, validCard) as { id: Id<"cards"> };
  return result.id;
}

// Helper: get the regular user's DB Id (requires a card to exist first).
async function getUserId(t: ReturnType<typeof makeT>) {
  return t.run(async (ctx) => {
    const u = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", userIdentity.tokenIdentifier))
      .unique();
    return u!._id;
  });
}

// ---------------------------------------------------------------------------
// getAccess
// ---------------------------------------------------------------------------

describe("getAccess", () => {
  test("unauthenticated user is not admin", async () => {
    const t = makeT();
    expect((await t.query(api.admin.getAccess, {})).isAdmin).toBe(false);
  });

  test("regular user is not admin", async () => {
    const t = makeT();
    expect((await t.withIdentity(userIdentity).query(api.admin.getAccess, {})).isAdmin).toBe(false);
  });

  test("admin email returns isAdmin=true", async () => {
    const t = makeT();
    expect((await t.withIdentity(adminIdentity).query(api.admin.getAccess, {})).isAdmin).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getDashboard
// ---------------------------------------------------------------------------

describe("getDashboard", () => {
  test("non-admin cannot access dashboard", async () => {
    const t = makeT();
    await expect(
      t.withIdentity(userIdentity).query(api.admin.getDashboard, {}),
    ).rejects.toThrow("Administrator access is required");
  });

  test("admin receives dashboard with stats", async () => {
    const t = makeT();
    await createCard(t);
    const dashboard = await t.withIdentity(adminIdentity).query(api.admin.getDashboard, {});
    expect(dashboard.stats.cards).toBeGreaterThan(0);
    expect(Array.isArray(dashboard.cards)).toBe(true);
    expect(Array.isArray(dashboard.users)).toBe(true);
    expect(Array.isArray(dashboard.reports)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setCardStatus
// ---------------------------------------------------------------------------

describe("setCardStatus", () => {
  test("non-admin cannot change card status", async () => {
    const t = makeT();
    const id = await createCard(t);
    await expect(
      t.withIdentity(userIdentity).mutation(api.admin.setCardStatus, { cardId: id, status: "hidden" }),
    ).rejects.toThrow("Administrator access is required");
  });

  test("admin can hide a published card", async () => {
    const t = makeT();
    const id = await createCard(t);
    await t.withIdentity(adminIdentity).mutation(api.admin.setCardStatus, { cardId: id, status: "hidden" });
    const dashboard = await t.withIdentity(adminIdentity).query(api.admin.getDashboard, {});
    expect(dashboard.cards.find((c) => c.id === id)?.status).toBe("hidden");
  });

  test("admin can republish a hidden non-expired card", async () => {
    const t = makeT();
    const id = await createCard(t);
    await t.withIdentity(adminIdentity).mutation(api.admin.setCardStatus, { cardId: id, status: "hidden" });
    await t.withIdentity(adminIdentity).mutation(api.admin.setCardStatus, { cardId: id, status: "published" });
    const dashboard = await t.withIdentity(adminIdentity).query(api.admin.getDashboard, {});
    expect(dashboard.cards.find((c) => c.id === id)?.status).toBe("published");
  });

  test("admin cannot republish an expired card", async () => {
    const t = makeT();
    const id = await createCard(t);
    await t.run(async (ctx) => {
      await ctx.db.patch(id, { expiresAt: Date.now() - 1000 });
    });
    await expect(
      t.withIdentity(adminIdentity).mutation(api.admin.setCardStatus, { cardId: id, status: "published" }),
    ).rejects.toThrow("Expired cards cannot be restored without renewal");
  });
});

// ---------------------------------------------------------------------------
// removeCard
// ---------------------------------------------------------------------------

describe("removeCard", () => {
  test("non-admin cannot delete cards", async () => {
    const t = makeT();
    const id = await createCard(t);
    await expect(
      t.withIdentity(userIdentity).mutation(api.admin.removeCard, { cardId: id }),
    ).rejects.toThrow("Administrator access is required");
  });

  test("admin can delete any card", async () => {
    const t = makeT();
    await createCard(t);
    const dashboard = await t.withIdentity(adminIdentity).query(api.admin.getDashboard, {});
    const cardId = dashboard.cards[0].id;
    const result = await t.withIdentity(adminIdentity).mutation(api.admin.removeCard, { cardId });
    expect(result.success).toBe(true);
    expect((await t.withIdentity(userIdentity).query(api.cards.listMine, {})).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// blockUser / unblockUser
// ---------------------------------------------------------------------------

describe("blockUser", () => {
  test("non-admin cannot block users", async () => {
    const t = makeT();
    await createCard(t);
    const userId = await getUserId(t);
    await expect(
      t.withIdentity(userIdentity).mutation(api.admin.blockUser, { userId }),
    ).rejects.toThrow("Administrator access is required");
  });

  test("admin blocking a user hides their published cards", async () => {
    const t = makeT();
    await createCard(t);
    const userId = await getUserId(t);
    const result = await t.withIdentity(adminIdentity).mutation(api.admin.blockUser, { userId });
    expect(result.success).toBe(true);
    expect(result.hiddenCards).toBeGreaterThan(0);

    // Cards are now hidden.
    const mine = await t.withIdentity(userIdentity).query(api.cards.listMine, {});
    expect(mine.every((c) => c.status === "hidden")).toBe(true);

    // Blocked user cannot post new cards.
    await expect(
      t.withIdentity(userIdentity).mutation(api.cards.create, validCard),
    ).rejects.toThrow("blocked");
  });
});

describe("unblockUser", () => {
  test("unblocking without restoreCards leaves cards hidden", async () => {
    const t = makeT();
    await createCard(t);
    const userId = await getUserId(t);
    await t.withIdentity(adminIdentity).mutation(api.admin.blockUser, { userId });
    const result = await t.withIdentity(adminIdentity).mutation(api.admin.unblockUser, {
      userId,
      restoreCards: false,
    });
    expect(result.restoredCards).toBe(0);
    expect((await t.withIdentity(userIdentity).query(api.cards.listMine, {})).every((c) => c.status === "hidden")).toBe(true);
  });

  test("unblocking with restoreCards=true restores non-expired cards", async () => {
    const t = makeT();
    await createCard(t);
    const userId = await getUserId(t);
    await t.withIdentity(adminIdentity).mutation(api.admin.blockUser, { userId });
    const result = await t.withIdentity(adminIdentity).mutation(api.admin.unblockUser, {
      userId,
      restoreCards: true,
    });
    expect(result.restoredCards).toBeGreaterThan(0);
    expect((await t.withIdentity(userIdentity).query(api.cards.listMine, {})).some((c) => c.status === "published")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolveReport
// ---------------------------------------------------------------------------

describe("resolveReport", () => {
  test("admin can resolve an open report", async () => {
    const t = makeT();
    const id = await createCard(t);
    await t.withIdentity(adminIdentity).mutation(api.cards.report, { cardId: id, reason: "spam" });

    const before = await t.withIdentity(adminIdentity).query(api.admin.getDashboard, {});
    expect(before.reports.length).toBeGreaterThan(0);
    const reportId = before.reports[0].id;

    await t.withIdentity(adminIdentity).mutation(api.admin.resolveReport, { reportId });

    const after = await t.withIdentity(adminIdentity).query(api.admin.getDashboard, {});
    expect(after.reports.find((r) => r.id === reportId)).toBeUndefined();
  });
});
