"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { openBugReport } from "@/lib/bug-report-signal";
import { Bug } from "lucide-react";

export function BugReportLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        openBugReport(current);
      }}
    >
      <Bug size={16} style={{ marginRight: "0.25rem" }} />      
    </button>
  );
}
