import { convexTest } from "convex-test";
import schema from "../../convex/schema";

export const modules = import.meta.glob("../../convex/**/*.ts");

/** A minimal valid card payload that passes all server-side validation. */
export const validCard = {
  name: "Bob's Plumbing",
  category: "Services" as const,
  subcategory: "Plumbing",
  line: "Fast, affordable local repairs",
  area: "Downtown",
  city: "Seattle",
  state: "WA",
  country: "US",
  phone: "+1 206 555 1234",
  paidAmount: 0,
  theme: "yellow" as const,
  imageIds: [] as never[],
  x: 10,
  y: 200,
  rotation: -2,
  width: 220,
};

/**
 * Build a fresh convex-test instance (isolated in-memory DB per call).
 * The generated `env` in Convex server functions resolves to `process.env`,
 * so any env vars must be set there before the test runs.
 */
export function makeT() {
  return convexTest(schema, modules);
}

/** Identity for a regular (non-admin) signed-in user. */
export const userIdentity = {
  subject: "user_abc123",
  tokenIdentifier: "https://clerk.test|user_abc123",
  name: "Alice Test",
  email: "alice@test.example",
};

/** Identity for a second user (used to test ownership checks). */
export const otherUserIdentity = {
  subject: "user_xyz456",
  tokenIdentifier: "https://clerk.test|user_xyz456",
  name: "Bob Other",
  email: "bob@test.example",
};

/** Admin identity — email must match the ADMIN_EMAILS env var used in makeT(adminEnv). */
export const adminIdentity = {
  subject: "user_admin",
  tokenIdentifier: "https://clerk.test|user_admin",
  name: "Admin User",
  email: "admin@wall.test",
};

export const adminEnv = { ADMIN_EMAILS: "admin@wall.test" };

/** Set process.env keys for the duration of a test suite. Returns a cleanup fn. */
export function applyEnv(env: Record<string, string>) {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    prev[k] = process.env[k];
    process.env[k] = v;
  }
  return () => {
    for (const [k, original] of Object.entries(prev)) {
      if (original === undefined) delete process.env[k];
      else process.env[k] = original;
    }
  };
}
