"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAnalytics, getAnalyticsConsent, initAnalytics, subscribeAnalyticsConsent } from "@/lib/analytics";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    if (getAnalyticsConsent() === "accepted") void initAnalytics();
    const unsubscribe = subscribeAnalyticsConsent(() => {
      if (getAnalyticsConsent() === "accepted") void initAnalytics();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (getAnalyticsConsent() !== "accepted") return;
    captureAnalytics("page_viewed", {
      path: pathname,
      search: query || "",
    });
  }, [pathname, query]);

  return null;
}
