import { test, expect } from "@playwright/test";

/**
 * Content moderation API tests — no auth required.
 * Tests /api/moderate directly with text payloads.
 * Image moderation (ONNX model) is skipped in CI unless the model is present.
 */

const MODERATE_URL = "/api/moderate";

function textForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

// ---------------------------------------------------------------------------
// Safe content passes
// ---------------------------------------------------------------------------

test.describe("Safe content", () => {
  test("clean name + line + message is approved", async ({ request }) => {
    const fd = textForm({
      name: "Bob's Plumbing",
      line: "Affordable pipe repairs",
      message: "Call us any time for a free quote.",
    });
    const res = await request.post(MODERATE_URL, { multipart: fd as never });
    expect(res.status()).toBe(200);
    const body = await res.json() as { safe: boolean };
    expect(body.safe).toBe(true);
  });

  test("empty optional fields still pass", async ({ request }) => {
    const fd = textForm({ name: "Quick Fix LLC", line: "Same-day appliance repair" });
    const res = await request.post(MODERATE_URL, { multipart: fd as never });
    const body = await res.json() as { safe: boolean };
    expect(body.safe).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Blocked text is rejected
// ---------------------------------------------------------------------------

test.describe("Blocked text content", () => {
  test("profanity in name is rejected", async ({ request }) => {
    const fd = textForm({ name: "nude services", line: "Totally normal service" });
    const res = await request.post(MODERATE_URL, { multipart: fd as never });
    const body = await res.json() as { safe: boolean; matches?: unknown[] };
    expect(body.safe).toBe(false);
    expect(body.matches?.length).toBeGreaterThan(0);
  });

  test("blocked text in line is rejected", async ({ request }) => {
    const fd = textForm({
      name: "Legit Business",
      line: "escort services available",
    });
    const res = await request.post(MODERATE_URL, { multipart: fd as never });
    const body = await res.json() as { safe: boolean };
    expect(body.safe).toBe(false);
  });

  test("blocked text in message is rejected", async ({ request }) => {
    const fd = textForm({
      name: "Legit Business",
      line: "Totally normal service line",
      message: "pornography content here",
    });
    const res = await request.post(MODERATE_URL, { multipart: fd as never });
    const body = await res.json() as { safe: boolean; matches?: Array<{ field: string }> };
    expect(body.safe).toBe(false);
    expect(body.matches?.some((m) => m.field === "message")).toBe(true);
  });

  test("hateful language is rejected", async ({ request }) => {
    const fd = textForm({
      name: "Legit Business",
      line: "kill all people test",
    });
    const res = await request.post(MODERATE_URL, { multipart: fd as never });
    const body = await res.json() as { safe: boolean };
    expect(body.safe).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

test.describe("Response contract", () => {
  test("response always has a safe boolean", async ({ request }) => {
    const fd = textForm({ name: "Test", line: "Test line here" });
    const res = await request.post(MODERATE_URL, { multipart: fd as never });
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.safe).toBe("boolean");
  });

  test("blocked response includes matches array", async ({ request }) => {
    const fd = textForm({ name: "nude shop", line: "Just a normal shop" });
    const res = await request.post(MODERATE_URL, { multipart: fd as never });
    const body = await res.json() as { safe: boolean; matches: Array<{ field: string; term: string; start: number; end: number }> };
    expect(body.safe).toBe(false);
    expect(Array.isArray(body.matches)).toBe(true);
    for (const match of body.matches) {
      expect(match).toHaveProperty("field");
      expect(match).toHaveProperty("term");
      expect(typeof match.start).toBe("number");
      expect(typeof match.end).toBe("number");
    }
  });

  test("wrong content-type returns 400 or rejects gracefully", async ({ request }) => {
    const res = await request.post(MODERATE_URL, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ name: "Test", line: "Test line" }),
    });
    // The route expects multipart — should respond with an error status.
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
