"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAnalyticsConsent } from "./analytics-consent-provider";

export function AnalyticsConsentToast() {
  const { consent, promptOpen, accept, decline } = useAnalyticsConsent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (consent !== "unknown" && !promptOpen) return null;
  if (!mounted) return null;

  return createPortal(
    <div
      className="analytics-consent-toast nf-card support-card"
      role="dialog"
      aria-live="polite"
      aria-label="Analytics consent"
      style={{ position: "fixed", right: 18, bottom: 18, left: "auto", top: "auto" }}
    >
      <div className="nf-tape" aria-hidden="true" />
      <div className="nf-stamp" aria-hidden="true">COOKIES</div>
      <p className="nf-eyebrow">Privacy · Consent</p>
      <div>
        <strong className="nf-headline">Analytics and cookies</strong>
        <p className="support-card-body">We use analytics cookies to improve the experience.</p>
        <p className="support-card-body">You can change your preferences by opening privacy settings.</p>
      </div>
      <div className="analytics-consent-actions flex gap-2">
        <button
          type="button"
          className="secondary flex-1"
          onClick={decline}
        >
          Decline
        </button>
        <button
          type="button"
          className="primary flex-1"
          onClick={accept}
        >
          Allow Analytics
        </button>
      </div>
      <footer className="nf-card-footer">
        <span>LocalWall</span>
        <span>privacy choices</span>
      </footer>
    </div>
    ,
    document.body,
  );
}
