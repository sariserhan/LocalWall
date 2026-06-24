import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const sig = request.headers.get("stripe-signature");
    const body = await request.text();
    if (!sig) return new Response("Missing stripe-signature header", { status: 400 });
    try {
      await ctx.runAction(internal.paymentsInternal.handleStripeWebhook, { sig, body });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook error";
      return new Response(message, { status: 400 });
    }
    return new Response("OK");
  }),
});

export default http;
