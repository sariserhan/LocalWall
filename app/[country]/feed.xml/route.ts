import { notFound } from "next/navigation";
import { Country } from "country-state-city";
import { parseCountrySlug } from "@/lib/wall-slug-server";
import { fetchInitialCards } from "@/lib/server-cards";
import { buildRssFeed, rssFeedResponse } from "@/lib/rss";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ country: string }> }) {
  const { country: cSlug } = await params;
  const country = parseCountrySlug(cSlug);
  if (!country) notFound();

  const countryName = Country.getAllCountries().find((c) => c.isoCode === country)?.name ?? country;
  const wallPath = `/${cSlug}`;

  const cards = await fetchInitialCards({ country });

  const xml = buildRssFeed({
    title: `${countryName} LocalWall — Latest Posts`,
    description: `Recent local ads, services, events and jobs posted on the ${countryName} community wall.`,
    wallPath,
    cards,
  });

  return rssFeedResponse(xml);
}
