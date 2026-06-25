"use client";

import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useState, useEffect } from "react";

export function UnsubscribeClient({ token }: { token: string }) {
  const unsubscribe = useMutation(api.digest.unsubscribeByToken);
  const [status, setStatus] = useState<"pending" | "done" | "error">("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    unsubscribe({ token })
      .then((result) => setStatus(result.success ? "done" : "error"))
      .catch(() => setStatus("error"));
  }, [token, unsubscribe]);

  return (
    <div className="unsubscribe-page">
      <div className="unsubscribe-card">
        <p className="unsubscribe-logo">WALL</p>
        {status === "pending" && (
          <>
            <p className="unsubscribe-title">Unsubscribing…</p>
            <p className="unsubscribe-body">Please wait while we remove you from the list.</p>
          </>
        )}
        {status === "done" && (
          <>
            <p className="unsubscribe-title">Unsubscribed</p>
            <p className="unsubscribe-body">
              You&apos;ve been removed from the weekly digest. You won&apos;t receive any more emails from us.
            </p>
            <a href="/" className="unsubscribe-home-link">Back to LocalWall →</a>
          </>
        )}
        {status === "error" && (
          <>
            <p className="unsubscribe-title">Link not found</p>
            <p className="unsubscribe-body">
              This unsubscribe link is invalid or has already been used.
            </p>
            <a href="/" className="unsubscribe-home-link">Back to LocalWall →</a>
          </>
        )}
      </div>
    </div>
  );
}
