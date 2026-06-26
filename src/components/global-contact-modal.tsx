"use client";

import { useCallback, useEffect, useState } from "react";
import { ContactPage } from "@/features/support/contact-page";
import { pushContactHandler } from "@/lib/contact-signal";

export function GlobalContactModal() {
  const [from, setFrom] = useState<string | undefined>(undefined);

  useEffect(() => {
    return pushContactHandler((page) => setFrom(page));
  }, []);

  const close = useCallback(() => setFrom(undefined), []);

  if (!from) return null;

  return <ContactPage from={from} onClose={close} />;
}
