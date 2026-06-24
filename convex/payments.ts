"use node";

import Stripe from "stripe";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, env } from "./_generated/server";

export const finalizePaidCard = action({
  args: { sessionId: v.string(), pendingCardId: v.id("pendingCards") },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must sign in to finish publishing.");
    if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured in Convex.");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);
    if (session.payment_status !== "paid") throw new Error("Payment is not complete.");
    if (session.metadata?.pendingCardId !== String(args.pendingCardId)) throw new Error("Payment does not match this pending card.");
    const paidAmount = (session.amount_total ?? 0) / 100;
    return await ctx.runMutation(internal.paymentsInternal.completePaidCard, {
      pendingCardId: args.pendingCardId,
      sessionId: session.id,
      paidAmount,
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});

export const finalizeVerification = action({
  args: { sessionId: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must sign in to complete verification.");
    if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured in Convex.");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);
    if (session.payment_status !== "paid") throw new Error("Payment is not complete.");
    if (session.metadata?.kind !== "verification") throw new Error("Payment does not match a verification request.");
    const paidAmount = (session.amount_total ?? 0) / 100;
    const plan = (session.metadata.plan ?? "monthly") as "monthly" | "annual";
    return await ctx.runMutation(internal.paymentsInternal.completeVerificationRequest, {
      sessionId: session.id,
      paidAmount,
      plan,
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});

export const finalizeSubscriptionPosting = action({
  args: { sessionId: v.string(), pendingCardId: v.id("pendingCards") },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must sign in to finish publishing.");
    if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured in Convex.");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(args.sessionId, { expand: ["subscription"] });
    if (session.metadata?.kind !== "subscription_posting") throw new Error("Payment does not match this card.");
    if (session.metadata.pendingCardId !== String(args.pendingCardId)) throw new Error("Payment does not match this pending card.");
    const subscription = session.subscription;
    if (!subscription || typeof subscription === "string") throw new Error("Subscription was not created.");
    if (subscription.status !== "active" && subscription.status !== "trialing") throw new Error("Subscription is not active.");
    const paidAmount = (session.amount_total ?? 0) / 100;
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? "");
    return await ctx.runMutation(internal.paymentsInternal.completePaidCard, {
      pendingCardId: args.pendingCardId,
      sessionId: session.id,
      paidAmount,
      tokenIdentifier: identity.tokenIdentifier,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId,
      autoRenew: true,
    });
  },
});

export const finalizeSubscriptionRenewal = action({
  args: { sessionId: v.string(), cardId: v.id("cards") },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must sign in to finish renewing.");
    if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured in Convex.");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(args.sessionId, { expand: ["subscription"] });
    if (session.metadata?.kind !== "subscription_renewal" || session.metadata.cardId !== String(args.cardId)) {
      throw new Error("Payment does not match this renewal.");
    }
    const subscription = session.subscription;
    if (!subscription || typeof subscription === "string") throw new Error("Subscription was not created.");
    if (subscription.status !== "active" && subscription.status !== "trialing") throw new Error("Subscription is not active.");
    const paidAmount = (session.amount_total ?? 0) / 100;
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? "");
    return await ctx.runMutation(internal.paymentsInternal.completeSubscriptionRenewal, {
      cardId: args.cardId,
      sessionId: session.id,
      paidAmount,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId,
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});

export const cancelAutoRenew = action({
  args: { cardId: v.id("cards") },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must sign in to cancel auto-renew.");
    if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured in Convex.");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const result = await ctx.runMutation(internal.paymentsInternal.cancelAutoRenewOnCard, {
      cardId: args.cardId,
      tokenIdentifier: identity.tokenIdentifier,
    }) as { subscriptionId?: string };
    if (result.subscriptionId) {
      await stripe.subscriptions.cancel(result.subscriptionId);
    }
    return { success: true };
  },
});

export const finalizeBundlePosting = action({
  args: { sessionId: v.string(), pendingCardId: v.id("pendingCards") },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must sign in to finish publishing.");
    if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured in Convex.");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);
    if (session.payment_status !== "paid") throw new Error("Payment is not complete.");
    if (session.metadata?.kind !== "bundle") throw new Error("Payment does not match a bundle posting.");
    if (session.metadata.pendingCardId !== String(args.pendingCardId)) throw new Error("Payment does not match this pending card.");
    const bundleCities = JSON.parse(session.metadata.bundleCities ?? "[]") as Array<{ country: string; state: string; city: string }>;
    if (!bundleCities.length) throw new Error("No cities found in bundle metadata.");
    const paidAmount = (session.amount_total ?? 0) / 100;
    return await ctx.runMutation(internal.paymentsInternal.completeBundlePosting, {
      pendingCardId: args.pendingCardId,
      sessionId: session.id,
      paidAmount,
      tokenIdentifier: identity.tokenIdentifier,
      bundleCities,
    });
  },
});

export const finalizePaidRenewal = action({
  args: { sessionId: v.string(), cardId: v.id("cards") },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must sign in to finish renewing.");
    if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured in Convex.");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);
    if (session.payment_status !== "paid") throw new Error("Payment is not complete.");
    if (session.metadata?.kind !== "renewal" || session.metadata.cardId !== String(args.cardId)) throw new Error("Payment does not match this renewal.");
    const paidAmount = (session.amount_total ?? 0) / 100;
    return await ctx.runMutation(internal.paymentsInternal.completePaidRenewal, {
      cardId: args.cardId,
      sessionId: session.id,
      paidAmount,
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});
