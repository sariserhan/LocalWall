import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing — LocalWall" };

function BillingCard({ stamp, eyebrow, headline, body }: {
  stamp: string;
  eyebrow: string;
  headline: string;
  body: string;
}) {
  return (
    <div className="nf-page">
      <div className="nf-grain" />
      <div className="nf-ghost nf-ghost-1" aria-hidden="true" />
      <div className="nf-ghost nf-ghost-2" aria-hidden="true" />
      <div className="nf-ghost nf-ghost-3" aria-hidden="true" />

      <div className="nf-card">
        <div className="nf-tape" aria-hidden="true" />
        <div className="nf-stamp" aria-hidden="true">{stamp}</div>

        <p className="nf-eyebrow">{eyebrow}</p>
        <h1 className="nf-headline" style={{ fontSize: "42px", marginBottom: "14px" }}>{headline}</h1>
        <p className="nf-body">{body}</p>

        <div className="nf-actions">
          <Link href="/" className="nf-btn-primary" style={{ marginRight: "180px",  }}>Back to LocalWall</Link>
        </div>

        <footer className="nf-card-footer">
          <span>LocalWall</span>
          <span>billing</span>
        </footer>
      </div>

      <p className="nf-brand">WALL</p>
    </div>
  );
}

export default async function BillingPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/");

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!convexUrl || !stripeKey) redirect("/");

  const token = await getToken({ template: "convex" });
  const convex = new ConvexHttpClient(convexUrl);
  if (token) convex.setAuth(token);

  const customerId = await convex.query(api.users.getMyCustomerId, {});

  if (!customerId) {
    return (
      <BillingCard
        stamp="NO PLAN"
        eyebrow="Notice · Billing"
        headline="No active plan."
        body="You don't have any active subscriptions or past payments on this account."
      />
    );
  }

  const stripe = new Stripe(stripeKey);
  const returnUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "") + "/";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    redirect(session.url);
  } catch {
    return (
      <BillingCard
        stamp="ERROR"
        eyebrow="Notice · Billing"
        headline="Portal unavailable."
        body="We couldn't open the billing portal right now. Please try again shortly or contact support."
      />
    );
  }
}
