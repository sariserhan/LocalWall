"use client";

import { useEffect, useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent, subscribeAnalyticsConsent } from "@/lib/analytics";

export function AnalyticsConsentToast() {
  const [consent, setConsent] = useState(getAnalyticsConsent());

  useEffect(() => {
    const unsubscribe = subscribeAnalyticsConsent(() => setConsent(getAnalyticsConsent()));
    return () => {
      unsubscribe();
    };
  }, []);

  if (consent !== "unknown") return null;

  return (
    <div className="analytics-consent-toast" role="dialog" aria-live="polite" aria-label="Analytics consent">
      <div>
        <strong>Analytics and cookies</strong>
        <p>We use analytics cookies to understand visits and improve the experience. You can change this choice later in browser storage settings.</p>
      </div>
      <div className="analytics-consent-actions flex gap-4">
        <button type="button" className="secondary flex-1" onClick={() => setAnalyticsConsent("declined")}>Decline</button>
        <button type="button" className="primary flex-1" onClick={() => setAnalyticsConsent("accepted")}>Allow Analytics</button>
      </div>
    </div>
  );
}
