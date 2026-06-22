import type { NextRequest } from "next/server";

// Dev-only: sends a test expiration reminder email to verify Resend is wired up.
// Usage: GET /api/test-email?to=you@example.com
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production." }, { status: 403 });
  }

  const to = request.nextUrl.searchParams.get("to");
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return Response.json({ error: "Pass a valid ?to=email address." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "WALL <noreply@wall.com>";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  if (!apiKey) {
    return Response.json({ error: "RESEND_API_KEY is not set in .env.local." }, { status: 503 });
  }

  const renewUrl = `${appUrl}/renew/test-card-id`;
  const tiers = [
    { amount: 0,     name: "Free",     duration: "1 day",    featured: false },
    { amount: 2.99,  name: "Basic",    duration: "30 days",  featured: false },
    { amount: 7.99,  name: "Featured", duration: "90 days",  featured: true  },
    { amount: 24.99, name: "Business", duration: "365 days", featured: false },
  ];

  const tierRows = tiers.map((tier) => {
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

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0ede6;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);">
    <div style="background:#1a1a18;padding:22px 32px;text-align:center;">
      <p style="color:#f5f1e8;font-size:22px;font-weight:800;letter-spacing:.15em;margin:0;">WALL</p>
      <p style="color:#888;font-size:11px;letter-spacing:.1em;margin:4px 0 0;">LOCAL ADS, STUCK HERE</p>
    </div>
    <div style="padding:32px 24px 28px;">
      <p style="margin:0 0 4px;font-size:11px;color:#e67e22;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">&#9888; Test email</p>
      <h2 style="margin:0 0 6px;font-size:20px;color:#1a1a18;">&#9203; 3 days left</h2>
      <p style="color:#666;margin:0 0 24px;font-size:14px;line-height:1.6;">
        <strong style="color:#1a1a18;">Sample Local Business</strong> expires on Sunday, June 24.
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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: "TEST — Your WALL card expires in 3 days",
      html,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return Response.json({ error: "Resend rejected the request.", detail: body }, { status: 502 });
  }
  return Response.json({ ok: true, sent_to: to, resend: body });
}
