"use node";

import Stripe from "stripe";
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
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return new Response("Stripe not configured", { status: 503 });
    }

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return new Response("Invalid webhook signature", { status: 400 });
    }

    try {
      if (event.type === "invoice.payment_succeeded") {
        // Use type assertion since Stripe SDK types vary by version
        const invoice = event.data.object as unknown as Record<string, unknown>;
        // Skip the initial invoice — finalized by checkout action on redirect
        if (invoice["billing_reason"] === "subscription_create") {
          return new Response("OK");
        }
        const sub = invoice["subscription"];
        const subscriptionId = typeof sub === "string" ? sub : (sub as { id: string } | null)?.id;
        if (!subscriptionId) return new Response("OK");
        const paidAmount = (invoice["amount_paid"] as number) / 100;
        const invoiceId = invoice["id"] as string;
        await ctx.runMutation(internal.paymentsInternal.processAutoRenewal, {
          subscriptionId,
          paidAmount,
          invoiceId,
        });
      }

      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        await ctx.runMutation(internal.paymentsInternal.clearAutoRenew, {
          subscriptionId: subscription.id,
        });
      }
    } catch (error) {
      console.error("Stripe webhook processing error:", error);
      // Return 200 so Stripe doesn't retry on application-level errors
    }

    return new Response("OK");
  }),
});

export default http;
