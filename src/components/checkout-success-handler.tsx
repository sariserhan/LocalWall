"use client";

import { useAction, useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { toast } from "@/lib/toast";

export function CheckoutSuccessHandler() {
  const { isAuthenticated } = useConvexAuth();
  const finalizePaidCard = useAction(api.payments.finalizePaidCard);
  const finalizePaidRenewal = useAction(api.payments.finalizePaidRenewal);
  const finalizeBundlePosting = useAction(api.payments.finalizeBundlePosting);
  const finalizeSubscriptionPosting = useAction(api.payments.finalizeSubscriptionPosting);
  const finalizeSubscriptionRenewal = useAction(api.payments.finalizeSubscriptionRenewal);
  const finalizeVerification = useAction(api.payments.finalizeVerification);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const checkoutStatus = searchParams.get("checkout");
    const checkoutKind = searchParams.get("kind");
    const isWallSurface = pathname.startsWith("/wall/") || pathname.startsWith("/card/");

    if (isWallSurface) return;
    if (!sessionId || !checkoutStatus || !checkoutKind) return;
    if (!isAuthenticated) return;
    if (isProcessingRef.current) return;

    if (checkoutStatus === "canceled") {
      window.history.replaceState({}, document.title, pathname);
      toast("Payment canceled. No changes were made.", "info");
      return;
    }

    if (checkoutStatus !== "success") return;

    isProcessingRef.current = true;
    void (async () => {
      try {
        if (checkoutKind === "verification") {
          await finalizeVerification({ sessionId });
          toast("Payment succeeded and your verification request is under review.");
          return;
        }

        if (checkoutKind === "renewal") {
          const cardId = searchParams.get("card_id");
          if (!cardId) throw new Error("The renewal card is missing.");
          await finalizePaidRenewal({ sessionId, cardId: cardId as Id<"cards"> });
          toast("Payment succeeded and your card has been renewed.");
          return;
        }

        if (checkoutKind === "subscription_renewal") {
          const cardId = searchParams.get("card_id");
          if (!cardId) throw new Error("The renewal card is missing.");
          await finalizeSubscriptionRenewal({ sessionId, cardId: cardId as Id<"cards"> });
          toast("Payment succeeded. Your card will now auto-renew.");
          return;
        }

        const pendingCardId = searchParams.get("pending_card_id");
        if (!pendingCardId) throw new Error("Could not find the pending paid card.");

        if (checkoutKind === "bundle") {
          await finalizeBundlePosting({ sessionId, pendingCardId: pendingCardId as Id<"pendingCards"> });
          toast("Payment succeeded. Your card is now live in multiple cities.");
          return;
        }

        if (checkoutKind === "subscription_posting") {
          await finalizeSubscriptionPosting({ sessionId, pendingCardId: pendingCardId as Id<"pendingCards"> });
          toast("Payment succeeded. Your card is on the wall and will auto-renew.");
          return;
        }

        await finalizePaidCard({ sessionId, pendingCardId: pendingCardId as Id<"pendingCards"> });
        toast("Payment succeeded and your card is now on the wall.");
      } catch (cause) {
        toast(cause instanceof Error ? cause.message : "Payment could not be finalized. Refresh the page to try again.", "error");
        return;
      } finally {
        isProcessingRef.current = false;
      }

      window.history.replaceState({}, document.title, pathname);
    })();
  }, [
    finalizeBundlePosting,
    finalizePaidCard,
    finalizePaidRenewal,
    finalizeSubscriptionPosting,
    finalizeSubscriptionRenewal,
    finalizeVerification,
    isAuthenticated,
    pathname,
    searchParams,
  ]);

  return null;
}
