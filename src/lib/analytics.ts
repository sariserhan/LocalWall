"use client";

type AnalyticsConsent = "unknown" | "accepted" | "declined";
type AnalyticsEventProps = Record<string, string | number | boolean | null | undefined>;
type PostHogClient = typeof import("posthog-js").default;

const CONSENT_KEY = "localwall-analytics-consent-v1";

let consentState: AnalyticsConsent = "unknown";
let clientPromise: Promise<{ default: PostHogClient }> | null = null;
let client: PostHogClient | null = null;
let initPromise: Promise<void> | null = null;
let pendingDistinctId: string | null = null;
const listeners = new Set<() => void>();

function readStoredConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return "unknown";
  const stored = window.localStorage.getItem(CONSENT_KEY);
  return stored === "accepted" || stored === "declined" ? stored : "unknown";
}

function persistConsent(next: AnalyticsConsent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, next);
}

function notifyListeners() {
  for (const listener of listeners) listener();
}

function getPostHogConfig() {
  return {
    token: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}

async function loadPostHog() {
  if (!clientPromise) {
    clientPromise = import("posthog-js");
  }
  const module = await clientPromise;
  return module.default;
}

export function getAnalyticsConsent() {
  if (consentState === "unknown" && typeof window !== "undefined") {
    consentState = readStoredConsent();
  }
  return consentState;
}

export function setAnalyticsConsent(next: Exclude<AnalyticsConsent, "unknown">) {
  consentState = next;
  persistConsent(next);
  if (next === "accepted") {
    void initAnalytics();
  } else if (client) {
    client.reset();
  }
  notifyListeners();
}

export function subscribeAnalyticsConsent(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function initAnalytics() {
  if (typeof window === "undefined" || getAnalyticsConsent() !== "accepted") return;
  if (client) return;
  if (!initPromise) {
    initPromise = (async () => {
      const { token, host } = getPostHogConfig();
      if (!token) return;
      const posthog = await loadPostHog();
      client = posthog;
      posthog.init(token, {
        api_host: host,
        capture_pageview: false,
        autocapture: true,
      });
      if (getAnalyticsConsent() !== "accepted") return;
      if (pendingDistinctId) {
        posthog.identify(pendingDistinctId);
      }
      posthog.capture("page_viewed", {
        path: window.location.pathname,
        search: window.location.search || "",
        title: document.title || undefined,
      });
    })().finally(() => {
      initPromise = null;
    });
  }
  await initPromise;
}

export function captureAnalytics(event: string, properties?: AnalyticsEventProps) {
  if (getAnalyticsConsent() !== "accepted") return;
  void initAnalytics().then(() => {
    if (getAnalyticsConsent() !== "accepted") return;
    client?.capture(event, properties);
  });
}

export function identifyAnalytics(distinctId: string) {
  pendingDistinctId = distinctId;
  if (getAnalyticsConsent() !== "accepted") return;
  void initAnalytics().then(() => {
    if (getAnalyticsConsent() !== "accepted") return;
    client?.identify(distinctId);
  });
}

export function resetAnalytics() {
  pendingDistinctId = null;
  if (client) client.reset();
}
