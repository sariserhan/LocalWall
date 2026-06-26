"use client";

import { useCallback, useEffect, useState } from "react";
import { BugReportPage } from "@/features/support/bug-report-page";
import { pushBugReportHandler } from "@/lib/bug-report-signal";

export function GlobalBugReportModal() {
  const [from, setFrom] = useState<string | undefined>(undefined);

  useEffect(() => {
    return pushBugReportHandler((page) => setFrom(page));
  }, []);

  const close = useCallback(() => setFrom(undefined), []);

  if (!from) return null;

  return <BugReportPage from={from} onClose={close} />;
}
