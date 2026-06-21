import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export type DurableRateLimitScope = "moderation_5m" | "moderation_day" | "checkout_hour" | "checkout_day";

export async function durableUserRateLimit(token: string | null, scopes: DurableRateLimitScope[]) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!token || !convexUrl) {
    return Response.json({ error: "Request protection is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "10" } });
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    client.setAuth(token);
    const result = await client.mutation(api.rateLimits.take, { scopes });
    if (result.allowed) return null;
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return Response.json({ error: "Too many requests. Please wait and try again." }, {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    });
  } catch (cause) {
    console.error("Durable rate-limit check failed", cause);
    return Response.json({ error: "Request protection is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "10" } });
  }
}
