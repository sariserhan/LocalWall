import { Suspense } from "react";
import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { ConnectedWallApp } from "@/features/wall/connected-wall-app";
import { parseLocationSlug, parseCategorySlug } from "@/lib/wall-slug";

interface Props {
  params: Promise<{ location: string; category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { location, category } = await params;
  const { city, state } = parseLocationSlug(location);
  const { category: cat, keyword } = parseCategorySlug(category);
  const locationLabel = [city, state].filter(Boolean).join(", ");
  const term = cat ?? keyword ?? category;
  const termCapitalized = term.charAt(0).toUpperCase() + term.slice(1);
  return {
    title: `${termCapitalized} in ${locationLabel} — WALL`,
    description: `Find local ${term} ads and services in ${locationLabel} on WALL.`,
  };
}

export default async function WallLocationCategoryPage({ params }: Props) {
  const { location, category } = await params;
  const parsedLocation = parseLocationSlug(location);
  const { category: initialCategory, keyword: initialKeyword } = parseCategorySlug(category);
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <AppProviders convexUrl={convexUrl} clerkPublishableKey={clerkPublishableKey}>
      <Suspense fallback={<div className="app-loading"><strong>WALL</strong><span>Loading your local wall…</span></div>}>
        <ConnectedWallApp
          initialLocation={parsedLocation}
          initialCategory={initialCategory}
          initialKeyword={initialKeyword}
        />
      </Suspense>
    </AppProviders>
  );
}
