"use client";

import { useClerk, useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const TIERS = [
  { amount: 0,     name: "Free",     label: "1 day",    price: "Free"   },
  { amount: 2.99,  name: "Basic",    label: "30 days",  price: "$2.99"  },
  { amount: 7.99,  name: "Featured", label: "90 days",  price: "$7.99", popular: true },
  { amount: 24.99, name: "Business", label: "365 days", price: "$24.99" },
] as const;

interface Props {
  cardId: string;
  preselectedAmount?: number;
}

export function RenewPage({ cardId, preselectedAmount }: Props) {
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { isLoaded: clerkLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const card = useQuery(
    api.cards.getMyCardForRenewal,
    isAuthenticated ? { cardId: cardId as Id<"cards"> } : "skip",
  );
  const renewFree = useMutation(api.cards.renew);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = convexLoading || !clerkLoaded;

  if (isLoading) {
    return (
      <div className="app-loading">
        <strong>WALL</strong>
        <span>Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <Header />
          <div style={{ padding: "32px 28px 28px", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1a1a18" }}>Sign in to renew</p>
            <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>
              Sign in to your WALL account to renew this card.
            </p>
            <button
              className="primary"
              style={{ width: "100%" }}
              onClick={() => openSignIn()}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (card === undefined) {
    return (
      <div className="app-loading">
        <strong>WALL</strong>
        <span>Loading card…</span>
      </div>
    );
  }

  if (card === null) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <Header />
          <div style={{ padding: "32px 28px 28px", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#1a1a18" }}>Card not found</p>
            <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
              This card doesn't exist or doesn't belong to your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notice) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <Header />
          <div style={{ padding: "32px 28px 28px", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#1a1a18" }}>&#10003; Renewed!</p>
            <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>{notice}</p>
            <a href="/" className="primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Back to the wall
            </a>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = card.expiresAt;
  const isExpired = expiresAt <= Date.now();
  const expiryLabel = isExpired
    ? "Expired"
    : new Date(expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const daysLeft = isExpired ? 0 : Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

  const handleRenew = async (amount: number) => {
    if (busy) return;
    setBusy(true);
    setError(null);

    if (amount === 0) {
      try {
        await renewFree({ cardId: card.id as Id<"cards">, paidAmount: 0 });
        setNotice(`${card.name} has been renewed for 1 day.`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Renewal failed. Please try again.");
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renewalPayload: { cardId: String(card.id), cardName: card.name, paidAmount: amount },
        }),
      });
      const result = await res.json() as { url?: string; error?: string };
      if (!res.ok || !result.url) throw new Error(result.error ?? "Could not start checkout.");
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <Header />
        <div style={{ padding: "28px 24px 24px" }}>
          <p style={{ margin: "0 0 2px", fontSize: 13, color: "#999", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Renewing
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#1a1a18" }}>{card.name}</p>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: isExpired ? "#c0392b" : daysLeft <= 1 ? "#e67e22" : "#666" }}>
            {isExpired ? "Expired" : daysLeft <= 1 ? `Expires today (${expiryLabel})` : `Expires ${expiryLabel} · ${daysLeft} days left`}
          </p>

          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#999", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Choose a plan
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TIERS.map((tier) => {
              const isPreselected = preselectedAmount === tier.amount;
              const isFeatured = "popular" in tier && tier.popular;
              return (
                <button
                  key={tier.amount}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRenew(tier.amount)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "14px 18px",
                    border: isPreselected ? "2px solid #1a1a18" : isFeatured ? "2px solid #1a1a18" : "2px solid #e8e4dc",
                    borderRadius: 8,
                    background: isFeatured ? "#1a1a18" : "#fff",
                    color: isFeatured ? "#f5f1e8" : "#1a1a18",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.6 : 1,
                    fontSize: 15,
                    fontWeight: 600,
                    textAlign: "left",
                  }}
                >
                  <span>{tier.price}</span>
                  <span style={{ fontWeight: 400, opacity: 0.8 }}>
                    {tier.label}
                    {isFeatured ? " · ★ Popular" : ""}
                    {isPreselected && !isFeatured ? " · Selected" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p style={{ margin: "16px 0 0", fontSize: 13, color: "#c0392b", padding: "10px 14px", background: "#fdf2f2", borderRadius: 6 }}>
              {error}
            </p>
          )}

          <p style={{ margin: "20px 0 0", fontSize: 12, color: "#bbb", textAlign: "center" }}>
            <a href="/" style={{ color: "#bbb", textDecoration: "underline" }}>Back to the wall</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div style={{ background: "#1a1a18", padding: "20px 28px", textAlign: "center" }}>
      <p style={{ color: "#f5f1e8", fontSize: 22, fontWeight: 800, letterSpacing: "0.15em", margin: 0 }}>WALL</p>
      <p style={{ color: "#888", fontSize: 11, letterSpacing: "0.1em", margin: "3px 0 0" }}>LOCAL ADS, STUCK HERE</p>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f0ede6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "#fff",
  borderRadius: 10,
  overflow: "hidden",
  boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
};
