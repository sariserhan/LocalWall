import { AppProviders } from "@/components/app-providers";
import { RenewPage } from "@/features/renew/renew-page";
import { getClerkPublishableKey } from "@/lib/clerk";
import { Suspense } from "react";

interface Props {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ amount?: string }>;
}

export const metadata = { title: "Renew your card | WALL" };

export default async function RenewCardPage({ params, searchParams }: Props) {
  const { cardId } = await params;
  const { amount } = await searchParams;
  const preselectedAmount = amount ? Number(amount) : undefined;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkPublishableKey = getClerkPublishableKey();

  return (
    <AppProviders convexUrl={convexUrl} clerkPublishableKey={clerkPublishableKey}>
      <Suspense fallback={<div className="app-loading"><strong>WALL</strong><span>Loading renewal…</span></div>}>
        <RenewPage cardId={cardId} preselectedAmount={preselectedAmount} />
      </Suspense>
    </AppProviders>
  );
}
