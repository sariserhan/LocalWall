"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { Check, ChevronDown, ChevronUp, Clock, CreditCard, ExternalLink, FlaskConical, Layers, Mail, RefreshCw, Shield, ShieldOff, Star, Trash2, X, Zap } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { categories, cardThemes } from "./types";

const PG_WALL_URL = "/admin/wall";
const PG_DEFAULTS = { country: "xx", state: "test", city: "Playground" };

const PLAN_OPTIONS = [
  { label: "Free (1 day)", value: 0, tag: "free" },
  { label: "$2.99 — 30 days", value: 2.99 },
  { label: "$7.99 — 90 days", value: 7.99 },
  { label: "$19.99 — 90 days (premium)", value: 19.99 },
  { label: "$24.99 — 365 days", value: 24.99, tag: "best" },
] as const;

const FEATURED_TIERS = [
  { label: "None", value: undefined },
  { label: "Bronze", value: "bronze" as const },
  { label: "Silver", value: "silver" as const },
  { label: "Gold", value: "gold" as const },
];

const EXPIRY_PRESETS = [
  { label: "2 min", ms: 2 * 60 * 1000 },
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "Expired now", ms: -1 },
] as const;

function useAsync<T>(fn: (...args: never[]) => Promise<T>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const run = async (...args: Parameters<typeof fn>) => {
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      await fn(...(args as never[]));
      setOk(true);
      setTimeout(() => setOk(false), 2400);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, ok, run, clearError: () => setError(null) };
}

function Section({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pg-section">
      <button className="pg-section-header" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="pg-section-icon">{icon}</span>
        <span className="pg-section-title">{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open ? <div className="pg-section-body">{children}</div> : null}
    </div>
  );
}

function PgError({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  return (
    <div className="pg-error" role="alert">
      <span>{msg}</span>
      <button onClick={onDismiss} aria-label="Dismiss"><X size={12} /></button>
    </div>
  );
}

function PgOk({ msg }: { msg: string }) {
  return <div className="pg-ok" role="status"><Check size={12} />{msg}</div>;
}

// ─── Create Card Section ──────────────────────────────────────────────────────

function CreateCardSection() {
  const createCard = useMutation(api.admin.playgroundCreateCard);

  const [name, setName] = useState("Test Business Co.");
  const [category, setCategory] = useState("Services");
  const [line, setLine] = useState("This is a test card posted from admin playground");
  const [theme, setTheme] = useState("yellow");
  const [paidAmount, setPaidAmount] = useState(0);
  const [featuredTier, setFeaturedTier] = useState<"bronze" | "silver" | "gold" | undefined>(undefined);
  const [paymentMode, setPaymentMode] = useState<"bypass" | "stripe">("bypass");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      if (paymentMode === "bypass") {
        const result = await createCard({ name, category, line, ...PG_DEFAULTS, theme, paidAmount, featuredTier }) as { cardId: Id<"cards"> };
        setLastId(String(result.cardId));
        setTimeout(() => setLastId(null), 5000);
      } else {
        // Create a pending (hidden) card then redirect to Stripe checkout
        const result = await createCard({ name, category, line, ...PG_DEFAULTS, theme, paidAmount, featuredTier, pending: true }) as { cardId: Id<"cards"> };
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingCardId: String(result.cardId), paidAmount, cardName: name }),
        });
        const data = await res.json() as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? "Stripe checkout could not be started.");
        window.location.href = data.url;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const stripeOnly = paymentMode === "stripe" && paidAmount === 0;

  return (
    <div className="pg-fields">
      <div className="pg-mode-toggle">
        <button
          className={`pg-mode-btn${paymentMode === "bypass" ? " selected" : ""}`}
          onClick={() => setPaymentMode("bypass")}
          type="button"
        >
          <Zap size={12} /> Bypass payment
        </button>
        <button
          className={`pg-mode-btn${paymentMode === "stripe" ? " selected" : ""}`}
          onClick={() => setPaymentMode("stripe")}
          type="button"
        >
          <CreditCard size={12} /> Test Stripe checkout
        </button>
      </div>

      <div className="pg-row-2">
        <label className="pg-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name" />
        </label>
        <label className="pg-field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <label className="pg-field">
        <span>Tagline</span>
        <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="Short description" />
      </label>
      <div className="pg-row-2">
        <label className="pg-field">
          <span>Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            {cardThemes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="pg-field">
          <span>Featured tier</span>
          <select value={featuredTier ?? ""} onChange={(e) => setFeaturedTier((e.target.value || undefined) as "bronze" | "silver" | "gold" | undefined)}>
            {FEATURED_TIERS.map((t) => <option key={t.label} value={t.value ?? ""}>{t.label}</option>)}
          </select>
        </label>
      </div>
      <div className="pg-plan-row">
        {PLAN_OPTIONS.map((p) => (
          <button
            key={p.value}
            className={`pg-plan-btn${paidAmount === p.value ? " selected" : ""}${paymentMode === "stripe" && p.value === 0 ? " pg-plan-btn-disabled" : ""}`}
            onClick={() => setPaidAmount(p.value)}
            type="button"
            disabled={paymentMode === "stripe" && p.value === 0}
            title={paymentMode === "stripe" && p.value === 0 ? "Free plan has no Stripe checkout" : undefined}
          >
            {p.label}{"tag" in p && p.tag === "best" ? <span className="pg-plan-tag">best</span> : null}
            {"tag" in p && p.tag === "free" ? <span className="pg-plan-tag free">free</span> : null}
          </button>
        ))}
      </div>
      {stripeOnly ? <p className="pg-hint" style={{ color: "#b91c1c" }}>Select a paid plan to test Stripe checkout (free has no payment).</p> : null}
      {error ? <PgError msg={error} onDismiss={() => setError(null)} /> : null}
      {lastId ? <PgOk msg={`Card created: ${lastId.slice(-8)} — visible on playground wall`} /> : null}
      <div className="pg-create-row">
        <button className="pg-action-btn" disabled={busy || !name.trim() || stripeOnly} onClick={handleCreate}>
          {busy
            ? (paymentMode === "stripe" ? "Redirecting to Stripe…" : "Creating…")
            : paymentMode === "bypass"
              ? <><Zap size={13} /> Create card (bypass payment)</>
              : <><CreditCard size={13} /> Create card + go to Stripe</>
          }
        </button>
        <a className="pg-wall-link" href={PG_WALL_URL} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={12} /> Open playground wall
        </a>
      </div>
      <p className="pg-hint">
        {paymentMode === "bypass"
          ? <>Card appears immediately on <code>{PG_WALL_URL}</code>. No Stripe involved.</>
          : <>Creates a hidden pending card, then redirects to real Stripe checkout. Use card <code>4242 4242 4242 4242</code> to test.</>
        }
      </p>
    </div>
  );
}

// ─── My Cards Section ─────────────────────────────────────────────────────────

type PgCard = {
  id: Id<"cards">;
  name: string;
  status: string;
  expiresAt: number;
  paidAmount: number;
  featuredTier: "bronze" | "silver" | "gold" | null;
  city: string;
  country: string;
  createdAt: number;
};

function CardToolRow({ card }: { card: PgCard }) {
  const setExpiry = useMutation(api.admin.playgroundSetExpiry);
  const setTier = useMutation(api.admin.playgroundSetFeaturedTier);
  const renew = useMutation(api.admin.playgroundRenewCard);
  const deleteCard = useMutation(api.admin.playgroundDeleteCard);
  const [renewPlan, setRenewPlan] = useState(card.paidAmount);
  const [tierPick, setTierPick] = useState<"bronze" | "silver" | "gold" | "">(card.featuredTier ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    setError(null);
    setOk(null);
    try {
      await fn();
      setOk(label);
      setTimeout(() => setOk(null), 2400);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="pg-card-row">
      <div className="pg-card-info">
        <span className={`status-dot status-${card.status}`} />
        <strong>{card.name}</strong>
        <span className="pg-card-meta">{card.city} · ${card.paidAmount} plan · expires {fmt(card.expiresAt)}</span>
        {card.featuredTier ? <span className="pg-card-tier">{card.featuredTier}</span> : null}
      </div>

      {error ? <PgError msg={error} onDismiss={() => setError(null)} /> : null}
      {ok ? <PgOk msg={`${ok} done`} /> : null}

      <div className="pg-card-actions">
        <div className="pg-card-action-group">
          <span className="pg-action-label">Set expiry</span>
          <div className="pg-btn-row">
            {EXPIRY_PRESETS.map((p) => (
              <button
                key={p.label}
                className="pg-sm-btn"
                disabled={busy !== null}
                onClick={() => run(`Expiry → ${p.label}`, () =>
                  setExpiry({ cardId: card.id, expiresAt: p.ms < 0 ? Date.now() - 1000 : Date.now() + p.ms })
                )}
              >
                <Clock size={10} />{p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pg-card-action-group">
          <span className="pg-action-label">Featured tier</span>
          <div className="pg-btn-row">
            <select className="pg-inline-select" value={tierPick} onChange={(e) => setTierPick(e.target.value as "bronze" | "silver" | "gold" | "")}>
              <option value="">None</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
            <button
              className="pg-sm-btn"
              disabled={busy !== null}
              onClick={() => run("Set tier", () => setTier({ cardId: card.id, tier: (tierPick || undefined) as "bronze" | "silver" | "gold" | undefined }))}
            >
              <Star size={10} /> Apply
            </button>
          </div>
        </div>

        <div className="pg-card-action-group">
          <span className="pg-action-label">Renew with plan</span>
          <div className="pg-btn-row">
            <select className="pg-inline-select" value={renewPlan} onChange={(e) => setRenewPlan(Number(e.target.value))}>
              {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button
              className="pg-sm-btn"
              disabled={busy !== null}
              onClick={() => run("Renew", () => renew({ cardId: card.id, paidAmount: renewPlan }))}
            >
              <RefreshCw size={10} /> Renew
            </button>
          </div>
        </div>

        <div className="pg-card-action-group pg-card-action-right">
          {confirmDelete ? (
            <>
              <span className="pg-confirm-label">Delete permanently?</span>
              <button className="pg-sm-btn danger" disabled={busy !== null} onClick={() => { setConfirmDelete(false); run("Delete", () => deleteCard({ cardId: card.id })); }}>
                <Trash2 size={10} /> Yes, delete
              </button>
              <button className="pg-sm-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className="pg-sm-btn danger" onClick={() => setConfirmDelete(true)}><Trash2 size={10} /> Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

function MyCardsSection() {
  const data = useQuery(api.admin.playgroundGetMyCards);
  const cards = (data?.cards ?? []) as PgCard[];

  if (!data) return <div className="pg-loading">Loading your cards…</div>;
  if (!cards.length) return (
    <div className="pg-empty">
      No cards yet. Create one above, then{" "}
      <a href={PG_WALL_URL} target="_blank" rel="noopener noreferrer" className="pg-inline-link">
        open the playground wall
      </a>{" "}to see them.
    </div>
  );

  return (
    <div className="pg-card-list">
      {cards.map((card) => <CardToolRow key={String(card.id)} card={card} />)}
      <a className="pg-wall-link pg-wall-link-bottom" href={PG_WALL_URL} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={12} /> Open playground wall to see all cards
      </a>
    </div>
  );
}

// ─── Email Tests Section ──────────────────────────────────────────────────────

function EmailTestSection() {
  const sendReminder = useAction(api.admin.sendTestReminderEmail);
  const sendDigest = useAction(api.admin.playgroundSendDigestTest);
  const [to, setTo] = useState("");

  const reminder = useAsync(sendReminder as (...args: never[]) => Promise<unknown>);
  const digest = useAsync(sendDigest as (...args: never[]) => Promise<unknown>);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);

  return (
    <div className="pg-fields">
      <label className="pg-field">
        <span>Recipient email</span>
        <input type="email" value={to} onChange={(e) => { setTo(e.target.value); reminder.clearError(); digest.clearError(); }} placeholder="test@example.com" />
      </label>
      <div className="pg-btn-row">
        <button
          className="pg-action-btn secondary"
          disabled={reminder.busy || !valid}
          onClick={() => (reminder.run as (...args: never[]) => Promise<void>)({ to } as never)}
        >
          {reminder.busy ? "Sending…" : reminder.ok ? <><Check size={12} /> Sent</> : <><Mail size={13} /> Send reminder email</>}
        </button>
        <button
          className="pg-action-btn secondary"
          disabled={digest.busy || !valid}
          onClick={() => (digest.run as (...args: never[]) => Promise<void>)({ to } as never)}
        >
          {digest.busy ? "Sending…" : digest.ok ? <><Check size={12} /> Sent</> : <><Mail size={13} /> Send digest email</>}
        </button>
      </div>
      {reminder.error ? <PgError msg={reminder.error} onDismiss={reminder.clearError} /> : null}
      {digest.error ? <PgError msg={digest.error} onDismiss={digest.clearError} /> : null}
      <p className="pg-hint">Reminder email: the standard card-expiry email. Digest email: the weekly local listings newsletter template.</p>
    </div>
  );
}

// ─── Subscription Tests Section ───────────────────────────────────────────────

function SubscriptionSection() {
  const subscribe = useMutation(api.digest.subscribe);
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(PG_DEFAULTS.country);
  const [state, setState] = useState(PG_DEFAULTS.state);
  const [city, setCity] = useState(PG_DEFAULTS.city);
  const [result, setResult] = useState<string | null>(null);
  const sub = useAsync(subscribe as (...args: never[]) => Promise<unknown>);

  const handleSubscribe = async () => {
    const res = await subscribe({ email, country, state, city }) as { alreadySubscribed: boolean };
    setResult(res.alreadySubscribed ? "Already subscribed — duplicate prevented." : "Subscribed successfully.");
    setTimeout(() => setResult(null), 4000);
  };

  return (
    <div className="pg-fields">
      <p className="pg-hint">Subscribe an email address to the weekly digest for a specific location, then verify it appears in the digest send list.</p>
      <label className="pg-field">
        <span>Email to subscribe</span>
        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); sub.clearError(); }} placeholder="test@example.com" />
      </label>
      <div className="pg-row-3">
        <label className="pg-field">
          <span>Country</span>
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="us" maxLength={4} />
        </label>
        <label className="pg-field">
          <span>State</span>
          <input value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" maxLength={4} />
        </label>
        <label className="pg-field">
          <span>City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        </label>
      </div>
      {sub.error ? <PgError msg={sub.error} onDismiss={sub.clearError} /> : null}
      {result ? <PgOk msg={result} /> : null}
      <button
        className="pg-action-btn"
        disabled={sub.busy || !email.includes("@") || !city.trim()}
        onClick={handleSubscribe}
      >
        {sub.busy ? "Subscribing…" : "Subscribe to digest"}
      </button>
    </div>
  );
}

// ─── Payment Tests Section ────────────────────────────────────────────────────

function PaymentSection() {
  return (
    <div className="pg-fields">
      <p className="pg-hint">To test the real Stripe payment flow, use the card composer on the wall page and select any paid plan. Use Stripe test card <code>4242 4242 4242 4242</code>, any future expiry, any CVC.</p>
      <div className="pg-payment-grid">
        <div className="pg-payment-item">
          <strong>One-time posting</strong>
          <span>Select a paid plan in the composer → Stripe Checkout → card created on success webhook</span>
        </div>
        <div className="pg-payment-item">
          <strong>Subscription posting</strong>
          <span>Select any plan + turn on Auto-renew → Stripe subscription created → monthly/annual renewal</span>
        </div>
        <div className="pg-payment-item">
          <strong>Renewal</strong>
          <span>Open an expired or near-expiry card in dashboard → Renew → Stripe Checkout</span>
        </div>
        <div className="pg-payment-item">
          <strong>Verification badge</strong>
          <span>Dashboard → Verification tab → Subscribe → monthly ($4.99) or annual ($19.99)</span>
        </div>
        <div className="pg-payment-item">
          <strong>Bundle (3 cities)</strong>
          <span>Composer step 3 → select Bundle → fill 3 city slots → Stripe Checkout (bundled SKU)</span>
        </div>
      </div>
      <p className="pg-hint" style={{ marginTop: 12 }}>All Stripe events are visible in the Stripe dashboard under Developers → Webhooks. Check <code>/api/webhooks/stripe</code> for the webhook endpoint.</p>
    </div>
  );
}

// ─── Verification Section ─────────────────────────────────────────────────────

function VerificationSection() {
  const data = useQuery(api.admin.playgroundGetMyCards);
  const setVerified = useMutation(api.admin.playgroundSetVerified);
  const { busy, error, ok, run, clearError } = useAsync(setVerified as (...args: never[]) => Promise<unknown>);
  const isVerified = data?.verified ?? false;

  return (
    <div className="pg-fields">
      <div className="pg-verify-row">
        <div>
          <strong>Your verification badge</strong>
          <p className="pg-hint" style={{ margin: "4px 0 0" }}>
            Status: <span className={`pg-verify-status${isVerified ? " yes" : ""}`}>{isVerified ? "✓ Verified" : "Not verified"}</span>
          </p>
        </div>
        <div className="pg-btn-row">
          <button
            className="pg-action-btn"
            disabled={busy || isVerified}
            onClick={() => (run as (...args: never[]) => Promise<void>)({ verified: true } as never)}
          >
            {busy ? "…" : <><Shield size={13} /> Verify me</>}
          </button>
          <button
            className="pg-action-btn secondary"
            disabled={busy || !isVerified}
            onClick={() => (run as (...args: never[]) => Promise<void>)({ verified: false } as never)}
          >
            {busy ? "…" : <><ShieldOff size={13} /> Unverify</>}
          </button>
        </div>
      </div>
      {error ? <PgError msg={error} onDismiss={clearError} /> : null}
      {ok ? <PgOk msg={isVerified ? "Verification removed." : "You are now verified. Reload the wall to see the badge."} /> : null}
      <p className="pg-hint">This toggles the verified badge (✓) on your own admin account and all your cards. Use it to test badge display without going through the payment flow.</p>
    </div>
  );
}

// ─── Bulk Create / Stress Test Section ───────────────────────────────────────

const BULK_COUNTS = [5, 10, 25, 50, 100] as const;
const BULK_NAMES = ["Ace Plumbing", "Metro Cleaners", "Star Tutors", "City Auto", "Fresh Bakes", "Peak Fitness", "Green Lawns", "Tech Repair", "Bright Smiles", "Quick Move"];
const BULK_CATEGORIES = ["Services", "Repairs", "Home & Garden", "Food & Catering", "Automotive", "Health & Fitness", "Technology", "Pets"] as const;
const BULK_THEMES = ["yellow", "paper", "pink", "cyan", "dark", "cream", "kraft"] as const;
const BULK_LINES = [
  "Fast, reliable and local.",
  "Serving the community since day one.",
  "Call us for a free quote today.",
  "Quality work at fair prices.",
  "Your trusted local expert.",
  "Same-day service available.",
  "Licensed & insured professionals.",
  "No job too big or too small.",
];

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function BulkCreateSection() {
  const createCard = useMutation(api.admin.playgroundCreateCard);
  const deleteAll = useMutation(api.admin.playgroundDeleteAllMyCards);
  const cardData = useQuery(api.admin.playgroundGetMyCards);
  const cardCount = cardData?.cards.length ?? 0;

  const [count, setCount] = useState<number>(10);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  const handleBulkCreate = async () => {
    setError(null);
    setProgress({ done: 0, total: count });
    const BATCH = 5;
    try {
      for (let i = 0; i < count; i += BATCH) {
        const batchSize = Math.min(BATCH, count - i);
        await Promise.all(
          Array.from({ length: batchSize }, () =>
            createCard({
              name: `${pick(BULK_NAMES)} #${Math.floor(Math.random() * 900 + 100)}`,
              category: pick(BULK_CATEGORIES),
              line: pick(BULK_LINES),
              ...PG_DEFAULTS,
              theme: pick(BULK_THEMES),
              paidAmount: 0,
            })
          )
        );
        setProgress({ done: Math.min(i + BATCH, count), total: count });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bulk create failed.");
    } finally {
      setTimeout(() => setProgress(null), 2000);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteBusy(true);
    setDeleteConfirm(false);
    setDeleteResult(null);
    try {
      const res = await deleteAll({}) as { deleted: number };
      setDeleteResult(`Deleted ${res.deleted} card${res.deleted !== 1 ? "s" : ""}.`);
      setTimeout(() => setDeleteResult(null), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Delete failed.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const running = progress !== null;

  return (
    <div className="pg-fields">
      <div className="pg-bulk-row">
        <div>
          <p className="pg-action-label" style={{ marginBottom: 8 }}>Number of cards</p>
          <div className="pg-btn-row">
            {BULK_COUNTS.map((n) => (
              <button
                key={n}
                className={`pg-plan-btn${count === n ? " selected" : ""}`}
                onClick={() => setCount(n)}
                disabled={running}
                type="button"
              >
                {n}
              </button>
            ))}
            <input
              className="pg-bulk-input"
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
              disabled={running}
              aria-label="Custom count"
            />
          </div>
        </div>
      </div>

      {error ? <PgError msg={error} onDismiss={() => setError(null)} /> : null}
      {deleteResult ? <PgOk msg={deleteResult} /> : null}

      {running ? (
        <div className="pg-progress">
          <div className="pg-progress-bar" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          <span>{progress.done} / {progress.total} cards created</span>
        </div>
      ) : null}

      <div className="pg-bulk-actions">
        <button className="pg-action-btn" disabled={running || deleteBusy} onClick={handleBulkCreate}>
          {running ? `Creating… ${progress!.done}/${progress!.total}` : <><Layers size={13} /> Create {count} random cards</>}
        </button>
        <a className="pg-wall-link" href={PG_WALL_URL} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={12} /> Open playground wall
        </a>
        {cardCount > 0 ? (
          deleteConfirm ? (
            <div className="pg-btn-row">
              <span className="pg-confirm-label">Delete all {cardCount} cards?</span>
              <button className="pg-sm-btn danger" disabled={deleteBusy} onClick={handleDeleteAll}>
                <Trash2 size={10} /> Yes, delete all
              </button>
              <button className="pg-sm-btn" onClick={() => setDeleteConfirm(false)}>Cancel</button>
            </div>
          ) : (
            <button className="pg-sm-btn danger" disabled={running || deleteBusy} onClick={() => setDeleteConfirm(true)}>
              <Trash2 size={10} /> Clear all ({cardCount})
            </button>
          )
        ) : null}
      </div>

      <p className="pg-hint">
        Creates cards with random names, categories, themes, and positions across the wall. Use it to stress-test layout, stacking, scroll, and performance. All cards land on <code>{PG_WALL_URL}</code>.
      </p>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function AdminPlayground() {
  return (
    <div className="pg-root" role="region" aria-label="Admin playground">
      <div className="pg-header">
        <FlaskConical size={15} />
        <div>
          <strong>Admin Playground</strong>
          <span>Test all features without real payments. All mutations are admin-only and bypass the normal user flows.</span>
        </div>
      </div>

      <Section title="Create Card (payment bypass)" icon={<Zap size={14} />} defaultOpen>
        <CreateCardSection />
      </Section>

      <Section title="Bulk Create — Stress Test" icon={<Layers size={14} />} defaultOpen>
        <BulkCreateSection />
      </Section>

      <Section title="My Cards — Quick Tools" icon={<CreditCard size={14} />} defaultOpen>
        <MyCardsSection />
      </Section>

      <Section title="Email Tests" icon={<Mail size={14} />}>
        <EmailTestSection />
      </Section>

      <Section title="Digest Subscriptions" icon={<RefreshCw size={14} />}>
        <SubscriptionSection />
      </Section>

      <Section title="Payment Flow Tests (real Stripe)" icon={<CreditCard size={14} />}>
        <PaymentSection />
      </Section>

      <Section title="Verification Badge" icon={<Shield size={14} />}>
        <VerificationSection />
      </Section>
    </div>
  );
}
