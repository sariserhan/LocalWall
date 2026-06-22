import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;

export const findCardsNeedingReminders = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const [published, hidden] = await Promise.all([
      ctx.db
        .query("cards")
        .withIndex("by_status_and_expiresAt", (q) =>
          q.eq("status", "published").gt("expiresAt", now).lte("expiresAt", now + THREE_DAYS_MS)
        )
        .collect(),
      ctx.db
        .query("cards")
        .withIndex("by_status_and_expiresAt", (q) =>
          q.eq("status", "hidden").gt("expiresAt", now).lte("expiresAt", now + THREE_DAYS_MS)
        )
        .collect(),
    ]);

    const cards = [...published, ...hidden];
    const results = [];

    for (const card of cards) {
      const timeLeft = card.expiresAt - now;
      const needs1d = timeLeft <= ONE_DAY_MS && !card.reminder1dSentAt;
      const needs3d = !needs1d && timeLeft <= THREE_DAYS_MS && !card.reminder3dSentAt;

      if (!needs1d && !needs3d) continue;
      if (card.paidAmount === 0) continue;

      const owner = await ctx.db.get(card.ownerId);
      if (!owner?.email) continue;

      results.push({
        cardId: card._id,
        cardName: card.name,
        expiresAt: card.expiresAt,
        ownerEmail: owner.email,
        reminderType: (needs1d ? "1d" : "3d") as "1d" | "3d",
      });
    }

    return results;
  },
});

export const markReminderSent = internalMutation({
  args: {
    cardId: v.id("cards"),
    reminderType: v.union(v.literal("3d"), v.literal("1d")),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.reminderType === "1d") {
      await ctx.db.patch(args.cardId, { reminder1dSentAt: args.sentAt });
    } else {
      await ctx.db.patch(args.cardId, { reminder3dSentAt: args.sentAt });
    }
  },
});

export const sendExpirationReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://wall.com").replace(/\/$/, "");

    if (!apiKey) {
      console.warn("[reminders] RESEND_API_KEY not set — skipping email reminders.");
      return;
    }

    const cards = await ctx.runQuery(internal.reminders.findCardsNeedingReminders, {});

    for (const card of cards) {
      const now = Date.now();
      const daysLeft = Math.ceil((card.expiresAt - now) / ONE_DAY_MS);
      const label = daysLeft <= 1 ? "1 day" : `${daysLeft} days`;
      const expiryDate = new Date(card.expiresAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      const renewUrl = `${appUrl}/renew/${encodeURIComponent(String(card.cardId))}`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [card.ownerEmail],
            subject: `Your WALL card expires in ${label}`,
            html: buildReminderEmail({ cardName: card.cardName, daysLeft, expiryDate, renewUrl }),
          }),
        });

        if (res.ok) {
          await ctx.runMutation(internal.reminders.markReminderSent, {
            cardId: card.cardId,
            reminderType: card.reminderType,
            sentAt: now,
          });
        } else {
          const body = await res.text().catch(() => "");
          console.error(`[reminders] Resend error for card ${String(card.cardId)}: ${res.status} ${body}`);
        }
      } catch (cause) {
        console.error(`[reminders] Failed to send reminder for card ${String(card.cardId)}:`, cause);
      }
    }
  },
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const RENEWAL_TIERS = [
  { amount: 0,     name: "Free",     duration: "1 day",    featured: false },
  { amount: 2.99,  name: "Basic",    duration: "30 days",  featured: false },
  { amount: 7.99,  name: "Featured", duration: "90 days",  featured: true  },
  { amount: 24.99, name: "Business", duration: "365 days", featured: false },
];

function buildReminderEmail({
  cardName,
  daysLeft,
  expiryDate,
  renewUrl,
}: {
  cardName: string;
  daysLeft: number;
  expiryDate: string;
  renewUrl: string;
}): string {
  const urgency = daysLeft <= 1 ? "&#9200; Last day to renew!" : `&#9203; ${daysLeft} days left`;

  const tierRows = RENEWAL_TIERS.map((tier) => {
    const bg = tier.featured ? "#1a1a18" : "#f5f1e8";
    const color = tier.featured ? "#f5f1e8" : "#1a1a18";
    const badge = tier.featured ? " &nbsp;&#9733; Popular" : "";
    const priceLabel = tier.amount === 0 ? "Free" : `$${tier.amount}`;
    return `<tr>
      <td style="padding:5px 0;">
        <a href="${renewUrl}?amount=${tier.amount}" style="display:block;background:${bg};color:${color};border-radius:7px;padding:14px 18px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;">
          <strong style="font-weight:700;">${tier.name} &mdash; ${priceLabel}</strong>
          <span style="float:right;opacity:.8;">${tier.duration}${badge}</span>
        </a>
      </td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0ede6;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);">
    <div style="background:#1a1a18;padding:22px 32px;text-align:center;">
      <p style="color:#f5f1e8;font-size:22px;font-weight:800;letter-spacing:.15em;margin:0;">WALL</p>
      <p style="color:#888;font-size:11px;letter-spacing:.1em;margin:4px 0 0;">LOCAL ADS, STUCK HERE</p>
    </div>
    <div style="padding:32px 24px 28px;">
      <h2 style="margin:0 0 6px;font-size:20px;color:#1a1a18;">${urgency}</h2>
      <p style="color:#666;margin:0 0 24px;font-size:14px;line-height:1.6;">
        <strong style="color:#1a1a18;">${escapeHtml(cardName)}</strong> expires on ${expiryDate}.
        Renew it to keep your spot on the wall.
      </p>
      <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#999;letter-spacing:.06em;text-transform:uppercase;">Choose a plan</p>
      <table style="width:100%;border-collapse:collapse;">${tierRows}</table>
      <p style="margin:28px 0 0;font-size:12px;color:#bbb;text-align:center;">
        You received this because you have a card on WALL.
      </p>
    </div>
  </div>
</body>
</html>`;
}
