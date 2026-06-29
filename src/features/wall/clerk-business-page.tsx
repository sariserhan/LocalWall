"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

type BusinessProfile = {
  displayName: string | null;
  username: string | null;
  businessName: string | null;
  verified: boolean;
} | null;

type ClerkBusinessPageProps = {
  profile: BusinessProfile | undefined;
  isReady: boolean;
  onUpdateBusinessName: (businessName: string | undefined) => Promise<void>;
};

export function ClerkBusinessPage({ profile, isReady, onUpdateBusinessName }: ClerkBusinessPageProps) {
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [selectedVerificationPlan, setSelectedVerificationPlan] = useState<"monthly" | "annual">("annual");

  useEffect(() => {
    if (!isReady) return;
    setBusinessName("");
    setSaved(false);
    setError(null);
  }, [isReady, profile?.username]);

  const saveBusinessName = async () => {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      await onUpdateBusinessName(businessName.trim() || undefined);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Business name could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const requestVerification = async (plan: "monthly" | "annual") => {
    setVerificationBusy(true);
    setVerificationError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationPayload: { plan } }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not start verification checkout.");
      window.location.assign(result.url);
    } catch (cause) {
      setVerificationError(cause instanceof Error ? cause.message : "Verification could not be started.");
    } finally {
      setVerificationBusy(false);
    }
  };

  const profileLabel = profile?.username ? `@${profile.username}` : profile?.displayName || "Unavailable";

  return (
    <div className="clerk-custom-page clerk-custom-page--business">
      <h1 className="clerk-custom-page-title">Business profile</h1>
      <p className="clerk-custom-page-desc">
        This sits beside your account details. Username stays in the Account tab, and the business name you want shown on your cards goes here.
      </p>
      {!isReady ? <p className="clerk-custom-page-error">Loading account data…</p> : null}
      <div className="clerk-custom-page-inline-card clerk-custom-page-inline-card--compact">
        <span>Username</span>
        <strong>{profileLabel}</strong>
        {profile?.verified ? <em className="clerk-custom-page-verified"><ShieldCheck size={14} /> Verified</em> : null}
      </div>
      <div className="clerk-custom-page-field clerk-custom-page-field--row">
        <label htmlFor="business-name-input"><span>Business name</span></label>
        <div className="clerk-custom-page-input-wrap">
          <input
            id="business-name-input"
            type="text"
            maxLength={60}
            placeholder={profile?.businessName ?? "e.g. John's Plumbing LLC"}
            value={businessName}
            onChange={(event) => {
              setBusinessName(event.target.value);
              setSaved(false);
            }}
          />
          {businessName ? (
            <button type="button" className="clerk-custom-page-clear" onClick={() => { setBusinessName(""); setSaved(false); }} aria-label="Clear business name">
              <X size={12} />
            </button>
          ) : null}
        </div>
        <button className={`clerk-custom-page-btn${saved ? " done" : ""}`} onClick={() => void saveBusinessName()} disabled={busy || !profile || !isReady}>
          {busy ? "Saving…" : saved ? <><Check size={14} /> Saved</> : "Update"}
        </button>
      </div>
      <section className="clerk-custom-page-verification">
        <div className="clerk-custom-page-section-head">
          <div>
            <h2>Verification</h2>
            <p>Add verified status to all your cards from here.</p>
          </div>
          {profile?.verified ? <span className="clerk-custom-page-verified-badge clerk-custom-page-verified-badge--active"><ShieldCheck size={14} /> Verified business</span> : <span className="clerk-custom-page-verified-badge">Not verified yet</span>}
        </div>
        <div className="verification-plans clerk-custom-page-verification-plans">
          <button
            className={`verification-plan${selectedVerificationPlan === "monthly" ? " verification-plan-selected" : ""}`}
            onClick={() => setSelectedVerificationPlan("monthly")}
            disabled={verificationBusy}
            aria-pressed={selectedVerificationPlan === "monthly"}
          >
            {selectedVerificationPlan === "monthly" ? <Check size={11} className="plan-check" /> : null}
            <div className="flex flex-col items-center gap-1">
              <strong>$4.99 / mo</strong>
              <span>Monthly</span>
            </div>
          </button>
          <button
            className={`verification-plan verification-plan-featured${selectedVerificationPlan === "annual" ? " verification-plan-selected" : ""}`}
            onClick={() => setSelectedVerificationPlan("annual")}
            disabled={verificationBusy}
            aria-pressed={selectedVerificationPlan === "annual"}
          >
            {selectedVerificationPlan === "annual" ? <Check size={11} className="plan-check" /> : null}
            <div className="flex flex-col items-center gap-1">
              <strong>$19.99 / yr</strong>
              <span>Annual — save 66%</span>
            </div>
          </button>
          <button className="primary verification-purchase-btn" disabled={verificationBusy || !isReady || (!profile?.username && !profile?.displayName)} onClick={() => { void requestVerification(selectedVerificationPlan); }}>
            {verificationBusy ? "…" : "Get Verified"}
          </button>
        </div>
      </section>
      {verificationError ? <p className="clerk-custom-page-error">{verificationError}</p> : null}
      {error ? <p className="clerk-custom-page-error">{error}</p> : null}
    </div>
  );
}
