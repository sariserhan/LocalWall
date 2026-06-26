"use client";

import { Mail } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { openContact } from "@/lib/contact-signal";

export function ContactLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  return (
    <button
      type="button"
      className={className}
      aria-label="Contact admin"
      onClick={() => {
        openContact(current);
      }}
    >
      <Mail size={16} style={{ marginRight: "0.25rem" }} />
    </button>
  );
}
