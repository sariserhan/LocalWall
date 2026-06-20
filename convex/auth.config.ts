import type { AuthConfig } from "convex/server";

const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
const issuerDomain = runtime.process?.env?.CLERK_JWT_ISSUER_DOMAIN?.trim();

if (!issuerDomain) {
  throw new Error("Missing CLERK_JWT_ISSUER_DOMAIN. Set it in your Convex deployment env.");
}

const issuerUrl = issuerDomain.startsWith("http://") || issuerDomain.startsWith("https://")
  ? issuerDomain.replace(/\/+$/, "")
  : `https://${issuerDomain.replace(/\/+$/, "")}`;

export default {
  providers: [{ domain: issuerUrl, applicationID: "convex" }],
} satisfies AuthConfig;
