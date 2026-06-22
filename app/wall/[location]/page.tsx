import { Suspense } from "react";
import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { ConnectedWallApp } from "@/features/wall/connected-wall-app";
import { parseLocationSlug } from "@/lib/wall-slug";

interface Props {
  params: Promise<{ location: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { location } = await params;
  const { city, state } = parseLocationSlug(location);
  const label = [city, state].filter(Boolean).join(", ");
  return {
    title: `${label} — WALL Local Ads`,
    description: `Browse local ads and services on the WALL in ${label}.`,
  };
}

export default async function WallLocationPage({ params }: Props) {
  const { location } = await params;
  const parsed = parseLocationSlug(location);
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <AppProviders convexUrl={convexUrl} clerkPublishableKey={clerkPublishableKey}>
      <Suspense fallback={<div className="app-loading"><strong>WALL</strong><span>Loading your local wall…</span></div>}>
        <ConnectedWallApp initialLocation={parsed} />
      </Suspense>
    </AppProviders>
  );
}
